import { beforeEach, describe, expect, it } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  SecretsManagerClient,
  UpdateSecretVersionStageCommand,
} from "@aws-sdk/client-secrets-manager";

const sm = mockClient(SecretsManagerClient);
// @ts-expect-error plain JS Lambda handler
const { handler } = await import("../infra/lambda/rotate-app-secret/index.mjs");

const current = { adminLinkKey: Buffer.alloc(32, 1).toString("base64"), captchaHmacKey: Buffer.alloc(32, 2).toString("base64"), rateLimitSecret: "old" };
const event = (Step: string) => ({ SecretId: "ip6/prod/app", ClientRequestToken: "v2", Step });

beforeEach(() => {
  sm.reset();
  sm.on(DescribeSecretCommand).resolves({ RotationEnabled: true, VersionIdsToStages: { v1: ["AWSCURRENT"], v2: ["AWSPENDING"] } });
});

describe("app secret rotation", () => {
  it("creates new 32-byte keys and keeps each old one as <key>Previous", async () => {
    sm.on(GetSecretValueCommand, { VersionStage: "AWSPENDING" }).rejects(Object.assign(new Error("none"), { name: "ResourceNotFoundException" }));
    sm.on(GetSecretValueCommand, { VersionStage: "AWSCURRENT" }).resolves({ SecretString: JSON.stringify(current) });
    sm.on(PutSecretValueCommand).resolves({});
    await handler(event("createSecret"));
    const put = sm.commandCalls(PutSecretValueCommand)[0]!.args[0].input;
    const next = JSON.parse(put.SecretString!);
    expect(put.VersionStages).toEqual(["AWSPENDING"]);
    for (const k of ["adminLinkKey", "captchaHmacKey", "rateLimitSecret"]) {
      expect(Buffer.from(next[k], "base64")).toHaveLength(32);
      expect(next[k]).not.toBe(current[k as keyof typeof current]);
      expect(next[`${k}Previous`]).toBe(current[k as keyof typeof current]);
    }
  });

  it("promotes the new version only at the finish step", async () => {
    sm.on(UpdateSecretVersionStageCommand).resolves({});
    await handler(event("finishSecret"));
    expect(sm.commandCalls(UpdateSecretVersionStageCommand)[0]!.args[0].input).toMatchObject({ VersionStage: "AWSCURRENT", MoveToVersionId: "v2", RemoveFromVersionId: "v1" });
  });

  it("rejects a pending version with a malformed key", async () => {
    sm.on(GetSecretValueCommand).resolves({ SecretString: JSON.stringify({ ...current, adminLinkKey: "short" }) });
    await expect(handler(event("testSecret"))).rejects.toThrow("adminLinkKey");
  });
});

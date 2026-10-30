// Secrets Manager rotation for ip6/{env}/app. Every key is replaced with 32
// fresh random bytes (base64) and the old value is kept as `<key>Previous`, so
// tokens signed just before a rotation (admin links, CAPTCHA puzzles, sign-up
// tokens) still verify until they expire. Nothing outside AWS uses these keys,
// so there is no external system to update in setSecret.
import { randomBytes } from "node:crypto";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  UpdateSecretVersionStageCommand,
} from "@aws-sdk/client-secrets-manager";

const sm = new SecretsManagerClient({});
const KEYS = ["adminLinkKey", "captchaHmacKey", "rateLimitSecret"];

export async function handler(event) {
  const { SecretId: id, ClientRequestToken: token, Step: step } = event;
  const meta = await sm.send(new DescribeSecretCommand({ SecretId: id }));
  if (!meta.RotationEnabled) throw new Error("rotation is not enabled");
  const stages = meta.VersionIdsToStages?.[token];
  if (!stages) throw new Error("unknown version");
  if (stages.includes("AWSCURRENT")) return; // already done
  if (!stages.includes("AWSPENDING")) throw new Error("version is not pending");

  if (step === "createSecret") {
    try {
      await sm.send(new GetSecretValueCommand({ SecretId: id, VersionId: token, VersionStage: "AWSPENDING" }));
      return; // created on an earlier attempt
    } catch (err) {
      if (err.name !== "ResourceNotFoundException") throw err;
    }
    const current = JSON.parse((await sm.send(new GetSecretValueCommand({ SecretId: id, VersionStage: "AWSCURRENT" }))).SecretString);
    const next = { ...current };
    for (const k of KEYS) {
      if (current[k]) next[`${k}Previous`] = current[k];
      next[k] = randomBytes(32).toString("base64");
    }
    await sm.send(new PutSecretValueCommand({ SecretId: id, ClientRequestToken: token, SecretString: JSON.stringify(next), VersionStages: ["AWSPENDING"] }));
    return;
  }
  if (step === "setSecret") return;
  if (step === "testSecret") {
    const pending = JSON.parse((await sm.send(new GetSecretValueCommand({ SecretId: id, VersionId: token, VersionStage: "AWSPENDING" }))).SecretString);
    for (const k of KEYS) if (Buffer.from(pending[k] ?? "", "base64").length !== 32) throw new Error(`${k} is not 32 bytes`);
    return;
  }
  if (step === "finishSecret") {
    const currentVersion = Object.entries(meta.VersionIdsToStages).find(([, s]) => s.includes("AWSCURRENT"))?.[0];
    await sm.send(
      new UpdateSecretVersionStageCommand({ SecretId: id, VersionStage: "AWSCURRENT", MoveToVersionId: token, RemoveFromVersionId: currentVersion }),
    );
    return;
  }
  throw new Error(`unknown step ${step}`);
}

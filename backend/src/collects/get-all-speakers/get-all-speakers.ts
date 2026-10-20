import { WebClient } from "@slack/web-api";
import { Member } from "@slack/web-api/dist/types/response/UsersListResponse.js";
import { Speaker } from "./speaker.js";
import { extractSpeakerOrUndefined } from "./member.functions.js";


function isValidMember(m: Member): boolean {
  return !m.is_bot && m.id !== "USLACKBOT";
}

async function collectMembersAsync(): Promise<Member[]> {
  const client = new WebClient(process.env.SLACK_TOKEN);
  const result = await client.users.list({});

  return result.members ?? [];
}

export async function getAllSpeakers(): Promise<Speaker[]> {
  const members = await collectMembersAsync();

  return mapToValidSpeakers(members);
}
// Un compte Slack désactivé (`deleted: true`) correspond à un membre parti de Shodo —
// toujours inclus ici (pas filtré) pour que ses anciens talks restent rattachables à
// un speaker connu, mais marqué `active: false` pour que le portail puisse les
// distinguer des membres actuels (voir applySpeakerActiveStatus.ts côté routes).
function mapToValidSpeakers(members: Member[]): Speaker[] {
  return members
    .filter((m) => isValidMember(m))
    .map((m): Speaker | null => {
      const speaker = extractSpeakerOrUndefined(m);
      return speaker ? { ...speaker, active: !m.deleted } : null;
    })
    .filter((s): s is Speaker => !!s);
}


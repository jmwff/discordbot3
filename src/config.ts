import dotenv from "dotenv";
dotenv.config();

const departments: Record<string, string> = {};
const deptRolesInput = process.env.DEPARTMENT_ROLE_IDS || "MPD:1518419278209093765, BCSO:1518419276413931672, SASP:1518419274719301733, FD:1518419280931061763, SACD:1518419283565088808, CivOps:1518419286077472809";
if (deptRolesInput) {
  deptRolesInput.split(",").forEach(pair => {
    const parts = pair.split(":");
    if (parts.length >= 2) {
      const name = parts[0].trim().toUpperCase();
      const id = parts[1].trim();
      if (name && id) departments[name] = id;
    }
  });
}

if (!process.env.DISCORD_TOKEN) {
  throw new Error(
    "DISCORD_TOKEN environment variable is not set. Add it in your Railway service's Variables tab — never hardcode bot tokens in source. " +
    "If a token was ever committed to this repo, treat it as compromised and regenerate it in the Discord Developer Portal."
  );
}

export const CONFIG = {
  token: process.env.DISCORD_TOKEN,
  primaryGuildId: process.env.PRIMARY_GUILD_ID || "1397663569645932664",
  allowedGuilds: (process.env.ALLOWED_GUILD_IDS || "1397663569645932664, 1450615073008783536, 1506021416296775750, 1450616749384011788, 1450617987085111430, 1450625412127391946, 1450624762610061354, 1448423121164963900").split(",").map(id => id.trim()).filter(Boolean),
  serverIp: "147.135.30.12",
  serverPort: "30120",
  serverName: process.env.SERVER_NAME || "East Bay Roleplay",
  cadLink: "https://cad.eastbayrp.net",
  playersServiceIp: process.env.PLAYERS_SERVICE_IP || "147.135.30.12:30120",
  roles: {
    patrolnotified: process.env.PATROL_NOTIFIED_ROLE_ID || "1518419299025289256",
    verified: process.env.VERIFIED_ROLE_ID || "1518419302162890782",
    member: process.env.MEMBER_ROLE_ID || "1518419263289823244",
    staffInTraining: process.env.STAFF_IN_TRAINING_ROLE_ID || "1518419261280751797",
    staff: process.env.STAFF_ROLE_ID || "1518419260156678224",
    seniorStaff: process.env.SENIOR_STAFF_ROLE_ID || "1518419258999046244",
    juniorAdmin: process.env.JUNIOR_ADMIN_ROLE_ID || "1518419257958989847",
    admin: process.env.ADMIN_ROLE_ID || "1518419256931516546",
    communityManager: process.env.COMMUNITY_MANAGER_ROLE_ID || "1518419252946665663",
    communityLeadership: process.env.COMMUNITY_LEADERSHIP_ROLE_ID || "1518419249419391131",
    departments
  }
};

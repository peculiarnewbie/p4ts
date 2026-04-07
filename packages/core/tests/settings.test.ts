import { describe, expect, it } from "bun:test";
import {
  mergeIncompleteSettings,
  parseP4SetOutput,
  parseP4vApplicationSettingsXml,
  parseP4vConnectionMapXml,
  parseP4vConnectionString,
  parseRegQueryOutput,
  resolveP4Settings,
  resolveP4SettingsWithDetails
} from "../src/public/settings.js";

describe("parseP4SetOutput", () => {
  it("parses quiet p4 set output", () => {
    expect(parseP4SetOutput([
      "P4CLIENT=Project_Main",
      "P4PORT=ssl:perforce.example.com:1666",
      "P4USER=surya",
      "P4CONFIG=.p4config"
    ].join("\n"))).toEqual({
      P4CLIENT: "Project_Main",
      P4PORT: "ssl:perforce.example.com:1666",
      P4USER: "surya"
    });
  });
});

describe("parseRegQueryOutput", () => {
  it("extracts tracked Perforce keys from reg query output", () => {
    expect(parseRegQueryOutput([
      "",
      "HKEY_CURRENT_USER\\Software\\Perforce\\Environment",
      "    P4CLIENT    REG_SZ    Project_Main",
      "    P4PORT    REG_SZ    ssl:perforce.example.com:1666",
      "    P4USER    REG_SZ    surya",
      "    P4CONFIG    REG_SZ    .p4config",
      ""
    ].join("\r\n"))).toEqual({
      P4CLIENT: "Project_Main",
      P4PORT: "ssl:perforce.example.com:1666",
      P4USER: "surya"
    });
  });
});

describe("parseP4vConnectionString", () => {
  it("parses full and partial connection strings without constructing undefined keys", () => {
    expect(parseP4vConnectionString("ssl:p4.example.com:1666, surya, Project_Main")).toEqual({
      P4PORT: "ssl:p4.example.com:1666",
      P4USER: "surya",
      P4CLIENT: "Project_Main"
    });

    expect(parseP4vConnectionString("ssl:p4.example.com:1666, surya")).toEqual({
      P4PORT: "ssl:p4.example.com:1666",
      P4USER: "surya"
    });
  });
});

describe("parseP4vApplicationSettingsXml", () => {
  it("prefers a later fully populated entry over an earlier connection missing P4CLIENT", () => {
    const xml = [
      '<PropertyList varName="Connection">',
      '  <String varName="LastConnection">ssl:server:1666, surya</String>',
      '  <StringList varName="RecentConnections">',
      "    <String>ssl:server:1666, surya, Project_Main</String>",
      "  </StringList>",
      "</PropertyList>"
    ].join("\n");

    expect(parseP4vApplicationSettingsXml(xml)).toEqual({
      P4PORT: "ssl:server:1666",
      P4USER: "surya",
      P4CLIENT: "Project_Main"
    });
  });

  it("returns the best partial candidate when no entry is fully connectable", () => {
    const xml = [
      '<PropertyList varName="Connection">',
      '  <String varName="LastConnection">ssl:server:1666</String>',
      "</PropertyList>"
    ].join("\n");

    expect(parseP4vApplicationSettingsXml(xml)).toEqual({
      P4PORT: "ssl:server:1666"
    });
  });
});

describe("parseP4vConnectionMapXml", () => {
  it("extracts the first connection map entry", () => {
    const xml = [
      '<ConnectionMapList varName="connectionmaplist">',
      "  <ConnectionMap>",
      "    <User>surya</User>",
      "    <P4Port>ssl:p4.example.com:1666</P4Port>",
      "  </ConnectionMap>",
      "  <ConnectionMap>",
      "    <User>other</User>",
      "    <P4Port>ssl:other.example.com:1666</P4Port>",
      "  </ConnectionMap>",
      "</ConnectionMapList>"
    ].join("\n");

    expect(parseP4vConnectionMapXml(xml)).toEqual({
      P4PORT: "ssl:p4.example.com:1666",
      P4USER: "surya"
    });
  });
});

describe("mergeIncompleteSettings", () => {
  it("fills only missing values", () => {
    expect(mergeIncompleteSettings(
      { P4PORT: "ssl:primary:1666" },
      { P4PORT: "ssl:fallback:1666", P4USER: "surya", P4CLIENT: "Project_Main" }
    )).toEqual({
      P4PORT: "ssl:primary:1666",
      P4USER: "surya",
      P4CLIENT: "Project_Main"
    });
  });
});

describe("resolveP4Settings", () => {
  it("uses the configured source precedence and records contributions", async () => {
    const result = await resolveP4SettingsWithDetails(
      { P4CLIENT: "cli-client" },
      {
        sources: ["p4v-app-settings", "p4v-connection-map", "cli", "registry"],
        readP4vAppSettings: async () => ({ P4PORT: "ssl:p4v:1666" }),
        readP4vConnectionMap: async () => ({ P4USER: "p4v-user" }),
        readRegistry: async () => ({ P4CLIENT: "registry-client" })
      }
    );

    expect(result).toEqual({
      settings: {
        P4PORT: "ssl:p4v:1666",
        P4USER: "p4v-user",
        P4CLIENT: "cli-client"
      },
      contributions: [
        { source: "p4v-app-settings", keys: ["P4PORT"] },
        { source: "p4v-connection-map", keys: ["P4USER"] },
        { source: "cli", keys: ["P4CLIENT"] }
      ]
    });
  });

  it("keeps the default resolver neutral by preferring cli before registry and P4V", async () => {
    const result = await resolveP4Settings(
      { P4PORT: "ssl:cli:1666", P4USER: "cli-user" },
      {
        readRegistry: async () => ({ P4PORT: "ssl:registry:1666", P4CLIENT: "registry-client" }),
        readP4vAppSettings: async () => ({
          P4PORT: "ssl:p4v:1666",
          P4USER: "p4v-user",
          P4CLIENT: "p4v-client"
        }),
        readP4vConnectionMap: async () => ({ P4USER: "map-user" })
      }
    );

    expect(result).toEqual({
      P4PORT: "ssl:cli:1666",
      P4USER: "cli-user",
      P4CLIENT: "registry-client"
    });
  });

  it("treats missing or failing sources as empty contributions", async () => {
    const result = await resolveP4Settings(
      {},
      {
        sources: ["p4v-app-settings", "registry"],
        readP4vAppSettings: async () => {
          throw new Error("missing");
        },
        readRegistry: async () => ({ P4PORT: "ssl:registry:1666", P4USER: "registry-user" })
      }
    );

    expect(result).toEqual({
      P4PORT: "ssl:registry:1666",
      P4USER: "registry-user"
    });
  });
});

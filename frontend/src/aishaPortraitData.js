import hq01 from "./aishaPortraitChunks/hq01.js";
import hq02 from "./aishaPortraitChunks/hq02.js";
import hq03 from "./aishaPortraitChunks/hq03.js";
import hq05 from "./aishaPortraitChunks/hq05.js";
import hq06 from "./aishaPortraitChunks/hq06.js";
import hq07 from "./aishaPortraitChunks/hq07.js";
import hq08 from "./aishaPortraitChunks/hq08.js";
import hq09 from "./aishaPortraitChunks/hq09.js";
import hq10 from "./aishaPortraitChunks/hq10.js";
import legacyHq1 from "./aishaPortraitChunks/hq1.js";
import legacyHq2 from "./aishaPortraitChunks/hq2.js";
import legacyHq3 from "./aishaPortraitChunks/hq3.js";
import legacyHq4 from "./aishaPortraitChunks/hq4.js";
import legacyHq5 from "./aishaPortraitChunks/hq5.js";

const BASE64_CHUNK_LENGTH = 9190;
const approvedEarlyMaster = `${legacyHq1}${legacyHq2}${legacyHq3}${legacyHq4}${legacyHq5}`;
const hq04 = approvedEarlyMaster.slice(
  BASE64_CHUNK_LENGTH * 3,
  BASE64_CHUNK_LENGTH * 4,
);

export const AISHA_PORTRAIT_WIDTH = 816;
export const AISHA_PORTRAIT_HEIGHT = 551;
export const AISHA_PORTRAIT_DATA_URI = `data:image/jpeg;base64,${hq01}${hq02}${hq03}${hq04}${hq05}${hq06}${hq07}${hq08}${hq09}${hq10}`;

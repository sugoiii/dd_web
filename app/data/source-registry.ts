import { mockBookSnapshotSource } from "./mock/common-source";
import { realBookSnapshotSource } from "./real/common-source";

const mockFlag = import.meta.env.VITE_USE_MOCK_DATA;
const useMockData = mockFlag === "true" || mockFlag === "1";

export const getBookSnapshotSource = () => (useMockData ? mockBookSnapshotSource : realBookSnapshotSource);

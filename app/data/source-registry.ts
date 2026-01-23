import { mockCommonSheetSource } from "./mock/common-source"
import { mockDelta1FeedSource } from "./mock/delta1-source"
import { realCommonSheetSource } from "./real/common-source"
import { realDelta1FeedSource } from "./real/delta1-source"

const mockFlag = import.meta.env.VITE_USE_MOCK_DATA
const useMockData = mockFlag === "true" || mockFlag === "1"

export const getCommonSheetSource = () =>
  useMockData ? mockCommonSheetSource : realCommonSheetSource

export const getDelta1FeedSource = () =>
  useMockData ? mockDelta1FeedSource : realDelta1FeedSource

import {GET_EVALUATIONS_QUERY} from './GetEvaluationsQuery';
import {
  OldGetEvaluationsQuery,
  OldGetEvaluationsQueryVariables,
} from './types/GetEvaluationsQuery.types';
import {useCursorPaginatedQuery} from '../../runs/useCursorPaginatedQuery';
import {AssetKey} from '../types';

export const PAGE_SIZE = 30;

// This function exists mostly to use the return type later
export function useEvaluationsQueryResult({assetKey}: {assetKey: AssetKey}) {
  return useCursorPaginatedQuery<OldGetEvaluationsQuery, OldGetEvaluationsQueryVariables>({
    nextCursorForResult: (data) => {
      if (
        data.autoMaterializeAssetEvaluationsOrError?.__typename ===
        'AutoMaterializeAssetEvaluationRecords'
      ) {
        return data.autoMaterializeAssetEvaluationsOrError.records[
          PAGE_SIZE - 1
        ]?.evaluationId.toString();
      }
      return undefined;
    },
    getResultArray: (data) => {
      if (
        data?.autoMaterializeAssetEvaluationsOrError?.__typename ===
        'AutoMaterializeAssetEvaluationRecords'
      ) {
        return data.autoMaterializeAssetEvaluationsOrError.records;
      }
      return [];
    },
    variables: {
      assetKey,
    },
    query: GET_EVALUATIONS_QUERY,
    pageSize: PAGE_SIZE,
  });
}

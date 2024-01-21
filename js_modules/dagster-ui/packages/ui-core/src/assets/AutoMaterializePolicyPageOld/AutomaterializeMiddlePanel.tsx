import {useQuery} from '@apollo/client';
import {Box, NonIdealState, Subheading} from '@dagster-io/ui-components';

import {AutomaterializeRequestedPartitionsLink} from './AutomaterializeRequestedPartitionsLink';
import {AutomaterializeRunTag} from './AutomaterializeRunTag';
import {GET_EVALUATIONS_QUERY} from './GetEvaluationsQuery';
import {RuleEvaluationOutcomes} from './RuleEvaluationOutcomes';
import {EvaluationOrEmpty, NoConditionsMetEvaluation} from './types';
import {
  AutoMaterializeEvaluationRecordItemFragment,
  OldGetEvaluationsQuery,
  OldGetEvaluationsQueryVariables,
  RuleWithEvaluationsFragment,
} from './types/GetEvaluationsQuery.types';
import {ErrorWrapper} from '../../app/PythonErrorInfo';
import {AutoMaterializeDecisionType, AutoMaterializeRule} from '../../graphql/types';
import {AssetKey} from '../types';

interface Props {
  assetKey: AssetKey;
  assetHasDefinedPartitions: boolean;
  selectedEvaluationId: number | undefined;
}

const EMPTY: EvaluationOrEmpty = {
  __typename: 'no_conditions_met',
  evaluationId: 0,
  amount: 0,
  endTimestamp: 0,
  startTimestamp: 0,
};

const extractRequestedPartitionKeys = (rulesWithEvaluations: RuleWithEvaluationsFragment[]) => {
  let requested: string[] = [];
  let skippedOrDiscarded: string[] = [];

  rulesWithEvaluations.forEach(({rule, ruleEvaluations}) => {
    const partitionKeys = ruleEvaluations.flatMap((e) =>
      e.partitionKeysOrError?.__typename === 'PartitionKeys'
        ? e.partitionKeysOrError.partitionKeys
        : [],
    );
    if (rule.decisionType === AutoMaterializeDecisionType.MATERIALIZE) {
      requested = requested.concat(partitionKeys);
    } else {
      skippedOrDiscarded = skippedOrDiscarded.concat(partitionKeys);
    }
  });

  const skippedOrDiscardedSet = new Set(skippedOrDiscarded);
  return new Set(requested.filter((partitionKey) => !skippedOrDiscardedSet.has(partitionKey)));
};

export const AutomaterializeMiddlePanel = (props: Props) => {
  const {assetKey, assetHasDefinedPartitions, selectedEvaluationId} = props;

  // We receive the selected evaluation ID and retrieve it here because the middle panel
  // may be displaying an evaluation that was not retrieved at the page level for the
  // left panel, e.g. as we paginate away from it, we don't want to lose it.
  const {data, loading, error} = useQuery<OldGetEvaluationsQuery, OldGetEvaluationsQueryVariables>(
    GET_EVALUATIONS_QUERY,
    {
      variables: {
        assetKey,
        cursor: selectedEvaluationId ? `${selectedEvaluationId + 1}` : undefined,
        limit: 2,
      },
    },
  );

  if (loading && !data) {
    return (
      <Box flex={{direction: 'column', grow: 1}}>
        <Box
          style={{flex: '0 0 48px'}}
          border="bottom"
          padding={{horizontal: 16}}
          flex={{alignItems: 'center', justifyContent: 'space-between'}}
        >
          <Subheading>Result</Subheading>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flex={{direction: 'column', grow: 1}}>
        <Box flex={{direction: 'row', justifyContent: 'center'}} padding={24}>
          <ErrorWrapper>{JSON.stringify(error)}</ErrorWrapper>
        </Box>
      </Box>
    );
  }

  if (
    data?.autoMaterializeAssetEvaluationsOrError?.__typename ===
    'AutoMaterializeAssetEvaluationNeedsMigrationError'
  ) {
    return (
      <Box flex={{direction: 'column', grow: 1}}>
        <Box flex={{direction: 'row', justifyContent: 'center'}} padding={{vertical: 24}}>
          <NonIdealState
            icon="error"
            title="Error"
            description={data.autoMaterializeAssetEvaluationsOrError.message}
          />
        </Box>
      </Box>
    );
  }

  const currentRules =
    (data?.assetNodeOrError.__typename === 'AssetNode' &&
      data.assetNodeOrError.autoMaterializePolicy?.rules) ||
    [];

  const evaluations = data?.autoMaterializeAssetEvaluationsOrError?.records || [];
  const selectedEvaluation =
    evaluations.find((evaluation) => evaluation.evaluationId === selectedEvaluationId) || EMPTY;

  return (
    <AutomaterializeMiddlePanelWithData
      currentRules={currentRules}
      assetHasDefinedPartitions={assetHasDefinedPartitions}
      selectedEvaluation={selectedEvaluation}
    />
  );
};

export const AutomaterializeMiddlePanelWithData = ({
  currentRules,
  selectedEvaluation,
  assetHasDefinedPartitions,
}: {
  currentRules: AutoMaterializeRule[];
  selectedEvaluation: NoConditionsMetEvaluation | AutoMaterializeEvaluationRecordItemFragment;
  assetHasDefinedPartitions: boolean;
}) => {
  const runIds =
    selectedEvaluation?.__typename === 'AutoMaterializeAssetEvaluationRecord'
      ? selectedEvaluation.runIds
      : [];
  const rulesWithRuleEvaluations =
    selectedEvaluation?.__typename === 'AutoMaterializeAssetEvaluationRecord'
      ? selectedEvaluation.rulesWithRuleEvaluations
      : [];
  const rules =
    selectedEvaluation?.__typename === 'AutoMaterializeAssetEvaluationRecord' &&
    selectedEvaluation.rules
      ? selectedEvaluation.rules
      : currentRules;

  const headerRight = () => {
    if (runIds.length === 0) {
      return null;
    }
    if (assetHasDefinedPartitions) {
      return (
        <AutomaterializeRequestedPartitionsLink
          runIds={runIds}
          partitionKeys={Array.from(extractRequestedPartitionKeys(rulesWithRuleEvaluations))}
          intent="success"
        />
      );
    }
    return <AutomaterializeRunTag runId={runIds[0]!} />;
  };

  return (
    <Box flex={{direction: 'column', grow: 1}}>
      <Box
        style={{flex: '0 0 48px'}}
        padding={{horizontal: 16}}
        border="bottom"
        flex={{alignItems: 'center', justifyContent: 'space-between'}}
      >
        <Subheading>Result</Subheading>
        <div>{headerRight()}</div>
      </Box>
      <RuleEvaluationOutcomes
        rules={rules}
        ruleEvaluations={rulesWithRuleEvaluations}
        assetHasDefinedPartitions={assetHasDefinedPartitions}
      />
    </Box>
  );
};

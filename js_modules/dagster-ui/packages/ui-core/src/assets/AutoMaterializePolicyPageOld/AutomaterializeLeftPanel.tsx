import {Box, Caption, Colors, CursorPaginationControls} from '@dagster-io/ui-components';
import styled from 'styled-components';

import {EvaluationCounts} from './EvaluationCounts';
import {AutoMaterializeEvaluationRecordItemFragment} from './types/GetEvaluationsQuery.types';
import {useEvaluationsQueryResult} from './useEvaluationsQueryResult';
import {TimestampDisplay} from '../../schedules/TimestampDisplay';

interface Props extends ListProps {
  evaluations: AutoMaterializeEvaluationRecordItemFragment[];
  paginationProps: ReturnType<typeof useEvaluationsQueryResult>['paginationProps'];
}

export const AutomaterializeLeftPanel = ({
  assetHasDefinedPartitions,
  evaluations,
  paginationProps,
  onSelectEvaluation,
  selectedEvaluation,
}: Props) => {
  return (
    <Box flex={{direction: 'column', grow: 1}} style={{overflowY: 'auto'}}>
      <AutomaterializeLeftList
        assetHasDefinedPartitions={assetHasDefinedPartitions}
        evaluations={evaluations}
        onSelectEvaluation={onSelectEvaluation}
        selectedEvaluation={selectedEvaluation}
      />
      {evaluations.length ? (
        <PaginationWrapper>
          <CursorPaginationControls {...paginationProps} />
        </PaginationWrapper>
      ) : null}
    </Box>
  );
};

interface ListProps {
  assetHasDefinedPartitions: boolean;
  evaluations: AutoMaterializeEvaluationRecordItemFragment[];
  onSelectEvaluation: (evaluation: AutoMaterializeEvaluationRecordItemFragment) => void;
  selectedEvaluation?: AutoMaterializeEvaluationRecordItemFragment;
}

export const AutomaterializeLeftList = (props: ListProps) => {
  const {assetHasDefinedPartitions, evaluations, onSelectEvaluation, selectedEvaluation} = props;

  return (
    <Box
      padding={{vertical: 8, horizontal: 12}}
      style={{flex: 1, minHeight: 0, overflowY: 'auto'}}
      flex={{grow: 1, direction: 'column'}}
    >
      {evaluations.map((evaluation) => {
        const isSelected = selectedEvaluation?.evaluationId === evaluation.evaluationId;
        const {numRequested, numSkipped, numDiscarded} = evaluation;

        return (
          <EvaluationListItem
            key={`skip-${evaluation.timestamp}`}
            onClick={() => {
              onSelectEvaluation(evaluation);
            }}
            $selected={isSelected}
          >
            <Box flex={{direction: 'column', gap: 4}}>
              <TimestampDisplay timestamp={evaluation.timestamp} />
              <EvaluationCounts
                numRequested={numRequested}
                numSkipped={numSkipped}
                numDiscarded={numDiscarded}
                isPartitionedAsset={assetHasDefinedPartitions}
                selected={isSelected}
              />
            </Box>
          </EvaluationListItem>
        );
      })}
      <Box border="top" padding={{vertical: 20, horizontal: 12}} margin={{top: 12}}>
        <Caption>Evaluations are retained for 30 days</Caption>
      </Box>
    </Box>
  );
};

const PaginationWrapper = styled.div`
  position: sticky;
  bottom: 0;
  background: ${Colors.backgroundLight()};
  border-right: 1px solid ${Colors.keylineDefault()};
  box-shadow: inset 0 1px ${Colors.keylineDefault()};
  margin-top: -1px;
  padding-bottom: 16px;
  padding-top: 16px;
  > * {
    margin-top: 0;
  }
`;

interface EvaluationListItemProps {
  $selected: boolean;
}

const EvaluationListItem = styled.button<EvaluationListItemProps>`
  background-color: ${({$selected}) =>
    $selected ? Colors.backgroundBlue() : Colors.backgroundDefault()};
  border: none;
  border-radius: 8px;
  color: ${({$selected}) => ($selected ? Colors.textBlue() : Colors.textDefault())};
  cursor: pointer;
  margin: 2px 0;
  text-align: left;
  transition:
    100ms background-color linear,
    100ms color linear;
  user-select: none;

  &:hover {
    background-color: ${({$selected}) =>
      $selected ? Colors.backgroundBlueHover() : Colors.backgroundDefaultHover()};
  }

  &:focus,
  &:active {
    outline: none;
  }

  padding: 8px 12px;
`;

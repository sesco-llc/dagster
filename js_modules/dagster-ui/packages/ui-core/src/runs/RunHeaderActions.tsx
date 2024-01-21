import {useMutation} from '@apollo/client';
import {Button, Group, Icon, Menu, MenuItem, Popover, Tooltip} from '@dagster-io/ui-components';
import {useContext, useState} from 'react';
import {useHistory} from 'react-router-dom';

import {DeletionDialog} from './DeletionDialog';
import {RunConfigDialog} from './RunConfigDialog';
import {doneStatuses} from './RunStatuses';
import {RunsQueryRefetchContext} from './RunUtils';
import {TerminationDialog} from './TerminationDialog';
import {RunFragment} from './types/RunFragments.types';
import {AppContext} from '../app/AppContext';
import {showSharedToaster} from '../app/DomUtils';
import {useCopyToClipboard} from '../app/browser';
import {FREE_CONCURRENCY_SLOTS_MUTATION} from '../instance/InstanceConcurrency';
import {
  FreeConcurrencySlotsMutation,
  FreeConcurrencySlotsMutationVariables,
} from '../instance/types/InstanceConcurrency.types';
import {AnchorButton} from '../ui/AnchorButton';
import {workspacePipelineLinkForRun, workspacePipelinePath} from '../workspace/workspacePath';

type VisibleDialog = 'config' | 'delete' | 'terminate' | 'free_slots' | null;

export const RunHeaderActions = ({run, isJob}: {run: RunFragment; isJob: boolean}) => {
  const {runConfigYaml} = run;
  const [visibleDialog, setVisibleDialog] = useState<VisibleDialog>(null);

  const {rootServerURI} = useContext(AppContext);
  const {refetch} = useContext(RunsQueryRefetchContext);

  const copy = useCopyToClipboard();
  const history = useHistory();

  const [freeSlots] = useMutation<
    FreeConcurrencySlotsMutation,
    FreeConcurrencySlotsMutationVariables
  >(FREE_CONCURRENCY_SLOTS_MUTATION);

  const copyConfig = async () => {
    copy(runConfigYaml);
    await showSharedToaster({
      intent: 'success',
      icon: 'copy_to_clipboard_done',
      message: 'Copied!',
    });
  };

  const freeConcurrencySlots = async () => {
    const resp = await freeSlots({variables: {runId: run.id}});
    if (resp.data?.freeConcurrencySlots) {
      await showSharedToaster({
        intent: 'success',
        icon: 'check_circle',
        message: 'Freed concurrency slots',
      });
    }
  };

  const jobLink = workspacePipelineLinkForRun({
    repositoryName: run.repositoryOrigin?.repositoryName,
    repositoryLocationName: run.repositoryOrigin?.repositoryLocationName,
    run,
    isJob,
  });

  return (
    <div>
      <Group direction="row" spacing={8}>
        {jobLink.disabledReason ? (
          <Tooltip content={jobLink.disabledReason} useDisabledButtonTooltipFix>
            <Button icon={<Icon name={jobLink.icon} />} disabled>
              {jobLink.label}
            </Button>
          </Tooltip>
        ) : (
          <AnchorButton icon={<Icon name={jobLink.icon} />} to={jobLink.to}>
            {jobLink.label}
          </AnchorButton>
        )}
        <Button icon={<Icon name="tag" />} onClick={() => setVisibleDialog('config')}>
          View tags and config
        </Button>
        <Popover
          position="bottom-right"
          content={
            <Menu>
              <Tooltip
                content="Loadable in dagster-webserver-debug"
                position="left"
                targetTagName="div"
              >
                <MenuItem
                  text="Download debug file"
                  icon={<Icon name="download_for_offline" />}
                  onClick={() => window.open(`${rootServerURI}/download_debug/${run.id}`)}
                />
              </Tooltip>
              {run.hasConcurrencyKeySlots && doneStatuses.has(run.status) ? (
                <MenuItem
                  text="Free concurrency slots"
                  icon={<Icon name="lock" />}
                  onClick={freeConcurrencySlots}
                />
              ) : null}
              {run.hasDeletePermission ? (
                <MenuItem
                  icon="delete"
                  text="Delete"
                  intent="danger"
                  onClick={() => setVisibleDialog('delete')}
                />
              ) : null}
            </Menu>
          }
        >
          <Button icon={<Icon name="expand_more" />} />
        </Popover>
      </Group>
      <RunConfigDialog
        isOpen={visibleDialog === 'config'}
        onClose={() => setVisibleDialog(null)}
        copyConfig={() => copyConfig()}
        mode={run.mode}
        runConfigYaml={run.runConfigYaml}
        tags={run.tags}
        isJob={isJob}
      />
      {run.hasDeletePermission ? (
        <DeletionDialog
          isOpen={visibleDialog === 'delete'}
          onClose={() => setVisibleDialog(null)}
          onComplete={() => {
            if (run.repositoryOrigin) {
              history.push(
                workspacePipelinePath({
                  repoName: run.repositoryOrigin.repositoryName,
                  repoLocation: run.repositoryOrigin.repositoryLocationName,
                  pipelineName: run.pipelineName,
                  isJob,
                  path: '/runs',
                }),
              );
            } else {
              setVisibleDialog(null);
            }
          }}
          onTerminateInstead={() => setVisibleDialog('terminate')}
          selectedRuns={{[run.id]: run.canTerminate}}
        />
      ) : null}
      {run.hasTerminatePermission ? (
        <TerminationDialog
          isOpen={visibleDialog === 'terminate'}
          onClose={() => setVisibleDialog(null)}
          onComplete={() => {
            refetch();
          }}
          selectedRuns={{[run.id]: run.canTerminate}}
        />
      ) : null}
    </div>
  );
};

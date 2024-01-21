import {QueryResult} from '@apollo/client';
import {Box, Tabs} from '@dagster-io/ui-components';

import {RepoAddress} from './types';
import {workspacePathFromAddress} from './workspacePath';
import {QueryRefreshCountdown, QueryRefreshState} from '../app/QueryRefresh';
import {TabLink} from '../ui/TabLink';

interface Props<TData> {
  repoAddress: RepoAddress;
  refreshState?: QueryRefreshState;
  queryData?: QueryResult<TData, any>;
  tab: string;
}

export const WorkspaceTabs = <TData extends Record<string, any>>(props: Props<TData>) => {
  const {repoAddress, refreshState, tab} = props;

  return (
    <Box flex={{direction: 'row', justifyContent: 'space-between', alignItems: 'flex-end'}}>
      <Tabs selectedTabId={tab}>
        <TabLink id="assets" title="Assets" to={workspacePathFromAddress(repoAddress, '/assets')} />
        <TabLink id="jobs" title="Jobs" to={workspacePathFromAddress(repoAddress, '/jobs')} />
        <TabLink
          id="schedules"
          title="Schedules"
          to={workspacePathFromAddress(repoAddress, '/schedules')}
        />
        <TabLink
          id="sensors"
          title="Sensors"
          to={workspacePathFromAddress(repoAddress, '/sensors')}
        />
        <TabLink id="graphs" title="Graphs" to={workspacePathFromAddress(repoAddress, '/graphs')} />
        <TabLink id="ops" title="Ops" to={workspacePathFromAddress(repoAddress, '/ops')} />
        <TabLink
          id="resources"
          title="Resources"
          to={workspacePathFromAddress(repoAddress, '/resources')}
        />
      </Tabs>
      {refreshState ? (
        <Box padding={{bottom: 8}}>
          <QueryRefreshCountdown refreshState={refreshState} />
        </Box>
      ) : null}
    </Box>
  );
};

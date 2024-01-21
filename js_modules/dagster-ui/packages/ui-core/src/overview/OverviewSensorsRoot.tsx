import {gql, useQuery} from '@apollo/client';
import {
  Box,
  Colors,
  Heading,
  NonIdealState,
  PageHeader,
  Spinner,
  TextInput,
  Tooltip,
} from '@dagster-io/ui-components';
import {useContext, useMemo} from 'react';

import {BASIC_INSTIGATION_STATE_FRAGMENT} from './BasicInstigationStateFragment';
import {OverviewSensorTable} from './OverviewSensorsTable';
import {OverviewTabs} from './OverviewTabs';
import {sortRepoBuckets} from './sortRepoBuckets';
import {BasicInstigationStateFragment} from './types/BasicInstigationStateFragment.types';
import {
  OverviewSensorsQuery,
  OverviewSensorsQueryVariables,
} from './types/OverviewSensorsRoot.types';
import {visibleRepoKeys} from './visibleRepoKeys';
import {PYTHON_ERROR_FRAGMENT} from '../app/PythonErrorFragment';
import {FIFTEEN_SECONDS, useQueryRefreshAtInterval} from '../app/QueryRefresh';
import {useTrackPageView} from '../app/analytics';
import {useDocumentTitle} from '../hooks/useDocumentTitle';
import {useQueryPersistedState} from '../hooks/useQueryPersistedState';
import {useSelectionReducer} from '../hooks/useSelectionReducer';
import {INSTANCE_HEALTH_FRAGMENT} from '../instance/InstanceHealthFragment';
import {filterPermissionedInstigationState} from '../instigation/filterPermissionedInstigationState';
import {SensorBulkActionMenu} from '../sensors/SensorBulkActionMenu';
import {SensorInfo} from '../sensors/SensorInfo';
import {makeSensorKey} from '../sensors/makeSensorKey';
import {CheckAllBox} from '../ui/CheckAllBox';
import {useFilters} from '../ui/Filters';
import {useCodeLocationFilter} from '../ui/Filters/useCodeLocationFilter';
import {useInstigationStatusFilter} from '../ui/Filters/useInstigationStatusFilter';
import {SearchInputSpinner} from '../ui/SearchInputSpinner';
import {WorkspaceContext} from '../workspace/WorkspaceContext';
import {buildRepoAddress} from '../workspace/buildRepoAddress';
import {repoAddressAsHumanString} from '../workspace/repoAddressAsString';
import {RepoAddress} from '../workspace/types';

export const OverviewSensorsRoot = () => {
  useTrackPageView();
  useDocumentTitle('Overview | Sensors');

  const {allRepos, visibleRepos, loading: workspaceLoading} = useContext(WorkspaceContext);
  const repoCount = allRepos.length;
  const [searchValue, setSearchValue] = useQueryPersistedState<string>({
    queryKey: 'search',
    defaults: {search: ''},
  });

  const codeLocationFilter = useCodeLocationFilter();
  const runningStateFilter = useInstigationStatusFilter();

  const filters = useMemo(
    () => [codeLocationFilter, runningStateFilter],
    [codeLocationFilter, runningStateFilter],
  );
  const {button: filterButton, activeFiltersJsx} = useFilters({filters});

  const queryResultOverview = useQuery<OverviewSensorsQuery, OverviewSensorsQueryVariables>(
    OVERVIEW_SENSORS_QUERY,
    {
      fetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    },
  );
  const {data, loading} = queryResultOverview;

  const refreshState = useQueryRefreshAtInterval(queryResultOverview, FIFTEEN_SECONDS);

  const repoBuckets = useMemo(() => {
    const visibleKeys = visibleRepoKeys(visibleRepos);
    return buildBuckets(data).filter(({repoAddress}) =>
      visibleKeys.has(repoAddressAsHumanString(repoAddress)),
    );
  }, [data, visibleRepos]);

  const {state: runningState} = runningStateFilter;
  const filteredBuckets = useMemo(() => {
    return repoBuckets.map(({sensors, ...rest}) => {
      return {
        ...rest,
        sensors: runningState.size
          ? sensors.filter(({sensorState}) => runningState.has(sensorState.status))
          : sensors,
      };
    });
  }, [repoBuckets, runningState]);

  const sanitizedSearch = searchValue.trim().toLocaleLowerCase();
  const anySearch = sanitizedSearch.length > 0;

  const filteredBySearch = useMemo(() => {
    const searchToLower = sanitizedSearch.toLocaleLowerCase();
    return filteredBuckets
      .map(({repoAddress, sensors}) => ({
        repoAddress,
        sensors: sensors.filter(({name}) => name.toLocaleLowerCase().includes(searchToLower)),
      }))
      .filter(({sensors}) => sensors.length > 0);
  }, [filteredBuckets, sanitizedSearch]);

  const anySensorsVisible = useMemo(
    () => filteredBySearch.some(({sensors}) => sensors.length > 0),
    [filteredBySearch],
  );

  // Collect all sensors across visible code locations that the viewer has permission
  // to start or stop.
  const allPermissionedSensors = useMemo(() => {
    return repoBuckets
      .map(({repoAddress, sensors}) => {
        return sensors
          .filter(({sensorState}) => filterPermissionedInstigationState(sensorState))
          .map(({name, sensorState}) => ({
            repoAddress,
            sensorName: name,
            sensorState,
          }));
      })
      .flat();
  }, [repoBuckets]);

  // Build a list of keys from the permissioned schedules for use in checkbox state.
  // This includes collapsed code locations.
  const allPermissionedSensorKeys = useMemo(() => {
    return allPermissionedSensors.map(({repoAddress, sensorName}) =>
      makeSensorKey(repoAddress, sensorName),
    );
  }, [allPermissionedSensors]);

  const [{checkedIds: checkedKeys}, {onToggleFactory, onToggleAll}] =
    useSelectionReducer(allPermissionedSensorKeys);

  // Filter to find keys that are visible given any text search.
  const permissionedKeysOnScreen = useMemo(() => {
    const filteredKeys = new Set(
      filteredBySearch
        .map(({repoAddress, sensors}) => {
          return sensors.map(({name}) => makeSensorKey(repoAddress, name));
        })
        .flat(),
    );
    return allPermissionedSensorKeys.filter((key) => filteredKeys.has(key));
  }, [allPermissionedSensorKeys, filteredBySearch]);

  // Determine the list of sensor objects that have been checked by the viewer.
  // These are the sensors that will be operated on by the bulk start/stop action.
  const checkedSensors = useMemo(() => {
    const checkedKeysOnScreen = new Set(
      permissionedKeysOnScreen.filter((key: string) => checkedKeys.has(key)),
    );
    return allPermissionedSensors.filter(({repoAddress, sensorName}) => {
      return checkedKeysOnScreen.has(makeSensorKey(repoAddress, sensorName));
    });
  }, [permissionedKeysOnScreen, allPermissionedSensors, checkedKeys]);

  const viewerHasAnyInstigationPermission = allPermissionedSensorKeys.length > 0;
  const checkedCount = checkedSensors.length;

  const content = () => {
    if (loading && !data) {
      return (
        <Box flex={{direction: 'row', justifyContent: 'center'}} style={{paddingTop: '100px'}}>
          <Box flex={{direction: 'row', alignItems: 'center', gap: 16}}>
            <Spinner purpose="body-text" />
            <div style={{color: Colors.textLight()}}>Loading sensors…</div>
          </Box>
        </Box>
      );
    }

    const anyReposHidden = allRepos.length > visibleRepos.length;

    if (!filteredBySearch.length) {
      if (anySearch) {
        return (
          <Box padding={{top: 20}}>
            <NonIdealState
              icon="search"
              title="No matching sensors"
              description={
                anyReposHidden ? (
                  <div>
                    No sensors matching <strong>{searchValue}</strong> were found in the selected
                    code locations
                  </div>
                ) : (
                  <div>
                    No sensors matching <strong>{searchValue}</strong> were found in your
                    definitions
                  </div>
                )
              }
            />
          </Box>
        );
      }

      return (
        <Box padding={{top: 20}}>
          <NonIdealState
            icon="search"
            title="No sensors"
            description={
              anyReposHidden
                ? 'No sensors were found in the selected code locations'
                : 'No sensors were found in your definitions'
            }
          />
        </Box>
      );
    }

    return (
      <OverviewSensorTable
        headerCheckbox={
          viewerHasAnyInstigationPermission ? (
            <CheckAllBox
              checkedCount={checkedCount}
              totalCount={permissionedKeysOnScreen.length}
              onToggleAll={onToggleAll}
            />
          ) : undefined
        }
        repos={filteredBySearch}
        checkedKeys={checkedKeys}
        onToggleCheckFactory={onToggleFactory}
      />
    );
  };

  const showSearchSpinner = (workspaceLoading && !repoCount) || (loading && !data);

  return (
    <Box flex={{direction: 'column'}} style={{height: '100%', overflow: 'hidden'}}>
      <PageHeader
        title={<Heading>Overview</Heading>}
        tabs={<OverviewTabs tab="sensors" refreshState={refreshState} />}
      />
      <Box
        padding={{horizontal: 24, vertical: 16}}
        flex={{
          direction: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          grow: 0,
        }}
      >
        <Box flex={{direction: 'row', gap: 12}}>
          {filterButton}
          <TextInput
            icon="search"
            value={searchValue}
            rightElement={
              showSearchSpinner ? (
                <SearchInputSpinner tooltipContent="Loading sensors…" />
              ) : undefined
            }
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Filter by sensor name…"
            style={{width: '340px'}}
          />
        </Box>
        <Tooltip
          content="You do not have permission to start or stop these schedules"
          canShow={anySensorsVisible && !viewerHasAnyInstigationPermission}
          placement="top-end"
          useDisabledButtonTooltipFix
        >
          <SensorBulkActionMenu sensors={checkedSensors} onDone={() => refreshState.refetch()} />
        </Tooltip>
      </Box>
      {activeFiltersJsx.length ? (
        <Box
          padding={{vertical: 8, horizontal: 24}}
          border="top-and-bottom"
          flex={{direction: 'row', gap: 8}}
        >
          {activeFiltersJsx}
        </Box>
      ) : null}
      {loading && !repoCount ? (
        <Box padding={64}>
          <Spinner purpose="page" />
        </Box>
      ) : (
        <>
          <SensorInfo
            daemonHealth={data?.instance.daemonHealth}
            padding={{vertical: 16, horizontal: 24}}
            border="top"
          />
          {content()}
        </>
      )}
    </Box>
  );
};

type RepoBucket = {
  repoAddress: RepoAddress;
  sensors: {name: string; sensorState: BasicInstigationStateFragment}[];
};

const buildBuckets = (data?: OverviewSensorsQuery): RepoBucket[] => {
  if (data?.workspaceOrError.__typename !== 'Workspace') {
    return [];
  }

  const entries = data.workspaceOrError.locationEntries.map((entry) => entry.locationOrLoadError);

  const buckets = [];

  for (const entry of entries) {
    if (entry?.__typename !== 'RepositoryLocation') {
      continue;
    }

    for (const repo of entry.repositories) {
      const {name, sensors} = repo;
      const repoAddress = buildRepoAddress(name, entry.name);

      if (sensors.length > 0) {
        buckets.push({
          repoAddress,
          sensors,
        });
      }
    }
  }

  return sortRepoBuckets(buckets);
};

const OVERVIEW_SENSORS_QUERY = gql`
  query OverviewSensorsQuery {
    workspaceOrError {
      ... on Workspace {
        id
        locationEntries {
          id
          locationOrLoadError {
            ... on RepositoryLocation {
              id
              name
              repositories {
                id
                name
                sensors {
                  id
                  name
                  description
                  sensorType
                  sensorState {
                    id
                    ...BasicInstigationStateFragment
                  }
                }
              }
            }
            ...PythonErrorFragment
          }
        }
      }
      ...PythonErrorFragment
    }
    instance {
      id
      ...InstanceHealthFragment
    }
  }

  ${BASIC_INSTIGATION_STATE_FRAGMENT}
  ${PYTHON_ERROR_FRAGMENT}
  ${INSTANCE_HEALTH_FRAGMENT}
`;

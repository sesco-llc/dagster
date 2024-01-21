import {Mono} from '@dagster-io/ui-components';
import {useEffect} from 'react';
import {Link, useHistory} from 'react-router-dom';

export interface ExplorerPath {
  pipelineName: string;
  snapshotId?: string;
  opsQuery: string;
  explodeComposites?: boolean;
  opNames: string[];
}

export const explorerPathSeparator = '~';

export function explorerPathToString(path: ExplorerPath) {
  const root = [
    path.pipelineName,
    path.snapshotId ? `@${path.snapshotId}` : ``,
    path.opsQuery
      ? `${explorerPathSeparator}${path.explodeComposites ? '!' : ''}${encodeURIComponent(
          path.opsQuery,
        )}`
      : ``,
  ].join('');

  return `${root}/${path.opNames.map(encodeURIComponent).join('/')}`;
}

export function explorerPathFromString(path: string): ExplorerPath {
  const rootAndOps = path.split('/');
  const root = rootAndOps[0]!;
  const opNames = rootAndOps.length === 1 ? [''] : rootAndOps.slice(1);

  const match = /^([^@~]+)@?([^~]+)?~?(!)?(.*)$/.exec(root);
  const [, pipelineName, snapshotId, explodeComposites, opsQuery] = [
    ...(match || []),
    '',
    '',
    '',
    '',
  ];

  return {
    pipelineName,
    snapshotId,
    opsQuery: decodeURIComponent(opsQuery || ''),
    explodeComposites: explodeComposites === '!',
    opNames: opNames.map(decodeURIComponent),
  };
}

export function useStripSnapshotFromPath(params: {pipelinePath: string}) {
  const history = useHistory();
  const {pipelinePath} = params;

  useEffect(() => {
    const {snapshotId, ...rest} = explorerPathFromString(pipelinePath);
    if (!snapshotId) {
      return;
    }
    history.replace({
      pathname: history.location.pathname.replace(
        new RegExp(`/${pipelinePath}/?`),
        `/${explorerPathToString(rest)}`,
      ),
    });
  }, [history, pipelinePath]);
}

export function getPipelineSnapshotLink(pipelineName: string, snapshotId: string) {
  return `/snapshots/${explorerPathToString({
    pipelineName,
    snapshotId,
    opsQuery: '',
    opNames: [],
  })}`;
}

export const PipelineSnapshotLink = (props: {
  pipelineName: string;
  snapshotId: string;
  size: 'small' | 'normal';
}) => {
  const snapshotLink = getPipelineSnapshotLink(props.pipelineName, props.snapshotId);

  return (
    <Mono style={{fontSize: props.size === 'small' ? '14px' : '16px'}}>
      <Link to={snapshotLink}>{props.snapshotId.slice(0, 8)}</Link>
    </Mono>
  );
};

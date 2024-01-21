import {Box, Colors, Icon, IconWrapper} from '@dagster-io/ui-components';
import * as React from 'react';
import styled from 'styled-components';

import {DUNDER_REPO_NAME} from '../workspace/buildRepoAddress';

export const SECTION_HEADER_HEIGHT = 32;

interface Props {
  expanded: boolean;
  onClick: (e: React.MouseEvent) => void;
  repoName: string;
  repoLocation: string;
  showLocation: boolean;
  rightElement?: React.ReactNode;
}

export const RepoSectionHeader = (props: Props) => {
  const {expanded, onClick, repoName, repoLocation, showLocation, rightElement} = props;
  const isDunderRepoName = repoName === DUNDER_REPO_NAME;
  return (
    <SectionHeaderButton $open={expanded} onClick={onClick}>
      <Box
        flex={{alignItems: 'center', justifyContent: 'space-between'}}
        padding={{horizontal: 24}}
      >
        <Box flex={{alignItems: 'center', gap: 8}}>
          <Icon name="folder" color={Colors.accentGray()} />
          <div>
            <RepoName>{isDunderRepoName ? repoLocation : repoName}</RepoName>
            {showLocation && !isDunderRepoName ? (
              <RepoLocation>{`@${repoLocation}`}</RepoLocation>
            ) : null}
          </div>
        </Box>
        <Box flex={{alignItems: 'center', gap: 8}}>
          {rightElement}
          <Box margin={{top: 2}}>
            <Icon name="arrow_drop_down" />
          </Box>
        </Box>
      </Box>
    </SectionHeaderButton>
  );
};

const SectionHeaderButton = styled.button<{$open: boolean}>`
  background-color: ${Colors.backgroundLight()};
  border: 0;
  box-shadow:
    inset 0px -1px 0 ${Colors.keylineDefault()},
    inset 0px 1px 0 ${Colors.keylineDefault()};
  color: ${Colors.textLight()};
  cursor: pointer;
  display: block;
  padding: 0;
  width: 100%;
  margin: 0;
  height: ${SECTION_HEADER_HEIGHT}px;
  text-align: left;

  :focus,
  :active {
    outline: none;
  }

  :hover {
    background-color: ${Colors.backgroundLightHover()};
  }

  ${IconWrapper}[aria-label="arrow_drop_down"] {
    transition: transform 100ms linear;
    ${({$open}) => ($open ? null : `transform: rotate(-90deg);`)}
  }
`;

const RepoName = styled.span`
  font-weight: 600;
`;

const RepoLocation = styled.span`
  font-weight: 400;
  color: ${Colors.textLighter()};
`;

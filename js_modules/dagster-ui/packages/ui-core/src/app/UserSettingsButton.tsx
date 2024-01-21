import {Colors, Icon, IconWrapper} from '@dagster-io/ui-components';
import {useState} from 'react';
import styled from 'styled-components';

import {UserSettingsDialog} from './UserSettingsDialog';
import {getVisibleFeatureFlagRows} from './getVisibleFeatureFlagRows';

const SettingsButton = styled.button`
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 24px;

  ${IconWrapper} {
    transition: background 50ms linear;
  }

  &:hover ${IconWrapper} {
    background: ${Colors.navTextHover()};
  }

  &:active ${IconWrapper} {
    background: ${Colors.navTextHover()};
  }

  &:focus {
    outline: none;

    ${IconWrapper} {
      background: ${Colors.navTextHover()};
    }
  }
`;

export const UserSettingsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <SettingsButton onClick={() => setIsOpen(true)} title="User settings">
        <Icon name="settings" color={Colors.navTextSelected()} />
      </SettingsButton>
      <UserSettingsDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        visibleFlags={getVisibleFeatureFlagRows()}
      />
    </>
  );
};

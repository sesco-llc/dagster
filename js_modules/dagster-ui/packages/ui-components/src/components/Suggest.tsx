// eslint-disable-next-line no-restricted-imports
import {IPopoverProps, InputGroupProps2} from '@blueprintjs/core';
// eslint-disable-next-line no-restricted-imports
import {Suggest as BlueprintSuggest, SuggestProps, isCreateNewItem} from '@blueprintjs/select';
import deepmerge from 'deepmerge';
import * as React from 'react';
import {List as _List} from 'react-virtualized';
import {createGlobalStyle} from 'styled-components';

import {Box} from './Box';
import {Colors} from './Color';
import {IconWrapper} from './Icon';
import {TextInputContainerStyles, TextInputStyles} from './TextInput';

// todo: react-virtualized needs updated types to work with React 18. For now lets any type.
const List: any = _List;

export const GlobalSuggestStyle = createGlobalStyle`
  .dagster-suggest-input.bp4-input-group {
    ${TextInputContainerStyles}

    &:disabled ${IconWrapper}:first-child {
      background-color: ${Colors.accentGray()};
    }

    .bp4-input {
      ${TextInputStyles}

      height: auto;

      ::placeholder {
        color: ${Colors.textDisabled()};
      }
    }

    .bp4-input-action {
      height: auto;
      top: 1px;
      right: 2px;
    }
  }

  .bp4-select-popover.dagster-popover {
    .bp4-popover-content li {
      list-style: none;
      margin: 0;
      padding: 0;
    }
  }
`;

export const MENU_ITEM_HEIGHT = 32;

const MENU_WIDTH = 250; // arbitrary, just looks nice
const VISIBLE_ITEMS = 7.5;

interface Props<T> extends React.PropsWithChildren<SuggestProps<T>> {
  itemHeight?: number;
  menuWidth?: number;
}

export const Suggest = <T,>(props: Props<T>) => {
  const {
    popoverProps = {},
    itemHeight = MENU_ITEM_HEIGHT,
    menuWidth = MENU_WIDTH,
    noResults,
    ...rest
  } = props;

  const allPopoverProps: Partial<IPopoverProps> = {
    ...popoverProps,
    minimal: true,
    modifiers: deepmerge({offset: {enabled: true, offset: '0, 8px'}}, popoverProps.modifiers || {}),
    popoverClassName: `dagster-popover ${props.popoverProps?.className || ''}`,
  };

  const inputProps: Partial<InputGroupProps2> = {
    ...props.inputProps,
    className: 'dagster-suggest-input',
  };

  return (
    <BlueprintSuggest<T>
      {...rest}
      inputProps={inputProps as any}
      itemListRenderer={(props) => {
        const {filteredItems} = props;
        if (filteredItems.length === 0 && noResults) {
          return (
            <Box
              padding={{vertical: 8, horizontal: 12}}
              style={{width: menuWidth, outline: 'none', marginRight: -5, paddingRight: 5}}
            >
              {noResults}
            </Box>
          );
        }

        return (
          <div style={{overscrollBehavior: 'contain'}}>
            <List
              style={{outline: 'none', marginRight: -5, paddingRight: 5}}
              rowCount={props.filteredItems.length}
              scrollToIndex={
                props.activeItem && !isCreateNewItem(props.activeItem)
                  ? props.filteredItems.indexOf(props.activeItem)
                  : undefined
              }
              rowHeight={itemHeight}
              rowRenderer={(a: any) => (
                <div key={a.index} style={a.style}>
                  {props.renderItem(props.filteredItems[a.index] as T, a.index)}
                </div>
              )}
              width={menuWidth}
              height={Math.min(props.filteredItems.length * itemHeight, itemHeight * VISIBLE_ITEMS)}
            />
          </div>
        );
      }}
      popoverProps={allPopoverProps}
    />
  );
};

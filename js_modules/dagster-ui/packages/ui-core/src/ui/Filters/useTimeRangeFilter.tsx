import {Box, Button, Colors, Dialog, DialogFooter, Icon, IconName} from '@dagster-io/ui-components';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import isEqual from 'lodash/isEqual';
import {Suspense, lazy, useContext, useEffect, useMemo, useState} from 'react';
import styled from 'styled-components';

import {FilterObject, FilterTag, FilterTagHighlightedText} from './useFilter';
import {TimeContext} from '../../app/time/TimeContext';
import {browserTimezone} from '../../app/time/browserTimezone';
import {useUpdatingRef} from '../../hooks/useUpdatingRef';

const DateRangePicker = lazy(() => import('./DateRangePickerWrapper'));

dayjs.extend(utc);
dayjs.extend(timezone);

export type TimeRangeState = [number | null, number | null];

export function calculateTimeRanges(timezone: string) {
  const targetTimezone = timezone === 'Automatic' ? browserTimezone() : timezone;
  const nowTimestamp = Date.now();
  const startOfDay = dayjs(nowTimestamp).tz(targetTimezone).startOf('day');
  const obj = {
    TODAY: {
      label: 'Today',
      range: [startOfDay.valueOf(), null] as TimeRangeState,
    },
    YESTERDAY: {
      label: 'Yesterday',
      range: [
        dayjs(nowTimestamp).tz(targetTimezone).subtract(1, 'day').startOf('day').valueOf(),
        startOfDay.valueOf(),
      ] as TimeRangeState,
    },
    LAST_7_DAYS: {
      label: 'Within last 7 days',
      range: [
        dayjs(nowTimestamp).tz(targetTimezone).subtract(1, 'week').valueOf(),
        null,
      ] as TimeRangeState,
    },
    LAST_30_DAYS: {
      label: 'Within last 30 days',
      range: [
        dayjs(nowTimestamp).tz(targetTimezone).subtract(30, 'days').valueOf(),
        null,
      ] as TimeRangeState,
    },
    CUSTOM: {label: 'Custom...', range: [null, null] as TimeRangeState},
  };
  const array = Object.keys(obj).map((keyString) => {
    const key = keyString as keyof typeof obj;
    return {
      key,
      label: obj[key].label,
      range: obj[key].range,
    };
  });
  return {timeRanges: obj, timeRangesArray: array};
}

export type TimeRangeFilter = FilterObject & {
  state: [number | null, number | null];
  setState: (state: TimeRangeState) => void;
};
type TimeRangeKey = keyof ReturnType<typeof calculateTimeRanges>['timeRanges'];
type Args = {
  name: string;
  icon: IconName;
  initialState?: TimeRangeState;
  onStateChanged?: (state: TimeRangeState) => void;
};
export function useTimeRangeFilter({
  name,
  icon,
  initialState,
  onStateChanged,
}: Args): TimeRangeFilter {
  const {
    timezone: [_timezone],
  } = useContext(TimeContext);
  const timezone = _timezone === 'Automatic' ? browserTimezone() : _timezone;
  const [state, setState] = useState<TimeRangeState>(initialState || [null, null]);
  useEffect(() => {
    onStateChanged?.(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state[0], state[1]]);

  useEffect(() => {
    setState(initialState || [null, null]);
  }, [initialState]);

  const {timeRanges, timeRangesArray} = useMemo(
    () => calculateTimeRanges(timezone),
    [
      timezone,
      // Recalculate once an hour
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Math.floor(Date.now() / (1000 * 60 * 60)),
    ],
  );

  const onReset = () => {
    setState([null, null]);
  };

  const filterObj = useMemo(
    () => ({
      name,
      icon,
      state,
      setState,
      isActive: state[0] !== null || state[1] !== null,
      getResults: (
        query: string,
      ): {
        label: JSX.Element;
        key: string;
        value: TimeRangeKey;
      }[] => {
        return timeRangesArray
          .filter(({label}) => query === '' || label.toLowerCase().includes(query.toLowerCase()))
          .map(({label, key}) => ({
            label: <TimeRangeResult range={label} />,
            key,
            value: key,
          }));
      },
      onSelect: ({
        value,
        close,
        createPortal,
      }: {
        value: TimeRangeKey;
        close: () => void;
        createPortal: (element: JSX.Element) => () => void;
      }) => {
        if (value === 'CUSTOM') {
          const closeRef = {
            current: () => {},
          };
          closeRef.current = createPortal(
            <CustomTimeRangeFilterDialog filter={filterObjRef.current} closeRef={closeRef} />,
          );
        } else {
          const nextState = timeRanges[value].range;
          setState(nextState);
        }
        close();
      },
      activeJSX: (
        <ActiveFilterState
          timeRanges={timeRanges}
          state={state}
          timezone={timezone}
          remove={onReset}
        />
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, icon, state, timeRanges, timezone, timeRangesArray],
  );
  const filterObjRef = useUpdatingRef(filterObj);
  return filterObj;
}

function TimeRangeResult({range}: {range: string}) {
  return (
    <Box flex={{direction: 'row', gap: 4, alignItems: 'center'}}>
      <Icon name="date" color={Colors.accentPrimary()} />
      {range}
    </Box>
  );
}

export function ActiveFilterState({
  state,
  remove,
  timezone,
  timeRanges,
}: {
  state: TimeRangeState;
  remove: () => void;
  timezone: string;
  timeRanges: ReturnType<typeof calculateTimeRanges>['timeRanges'];
}) {
  const L_FORMAT = useMemo(
    () =>
      new Intl.DateTimeFormat(navigator.language, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: timezone,
      }),
    [timezone],
  );
  const dateLabel = useMemo(() => {
    if (isEqual(state, timeRanges.TODAY.range)) {
      return (
        <>
          is <FilterTagHighlightedText>Today</FilterTagHighlightedText>
        </>
      );
    } else if (isEqual(state, timeRanges.YESTERDAY.range)) {
      return (
        <>
          is <FilterTagHighlightedText>Yesterday</FilterTagHighlightedText>
        </>
      );
    } else if (isEqual(state, timeRanges.LAST_7_DAYS.range)) {
      return (
        <>
          is within <FilterTagHighlightedText>Last 7 days</FilterTagHighlightedText>
        </>
      );
    } else if (isEqual(state, timeRanges.LAST_30_DAYS.range)) {
      return (
        <>
          is within <FilterTagHighlightedText>Last 30 days</FilterTagHighlightedText>
        </>
      );
    } else {
      if (!state[0]) {
        return (
          <>
            is before{' '}
            <FilterTagHighlightedText>{L_FORMAT.format(state[1]!)}</FilterTagHighlightedText>
          </>
        );
      }
      if (!state[1]) {
        return (
          <>
            is after{' '}
            <FilterTagHighlightedText>{L_FORMAT.format(state[0]!)}</FilterTagHighlightedText>
          </>
        );
      }
      return (
        <>
          is in range{' '}
          <FilterTagHighlightedText>{L_FORMAT.format(state[0]!)}</FilterTagHighlightedText>
          {' - '}
          <FilterTagHighlightedText>{L_FORMAT.format(state[1]!)}</FilterTagHighlightedText>
        </>
      );
    }
  }, [L_FORMAT, state, timeRanges]);

  return (
    <FilterTag
      iconName="date"
      label={
        <Box flex={{direction: 'row', gap: 4, alignItems: 'center'}}>Timestamp {dateLabel}</Box>
      }
      onRemove={remove}
    />
  );
}

export function CustomTimeRangeFilterDialog({
  filter,
  closeRef,
}: {
  filter: TimeRangeFilter;
  closeRef: {current: () => void};
}) {
  const [startDate, setStartDate] = useState<moment.Moment | null>(null);
  const [endDate, setEndDate] = useState<moment.Moment | null>(null);
  const [focusedInput, setFocusedInput] = useState<'startDate' | 'endDate'>('startDate');

  const [isOpen, setIsOpen] = useState(true);

  return (
    <Dialog
      isOpen={isOpen}
      title="Select a date range"
      onClosed={() => {
        // close the portal after the animation is done
        closeRef.current();
      }}
      style={{width: '652px'}}
    >
      <Container>
        <Box flex={{direction: 'row', gap: 8}} padding={16}>
          <Suspense fallback={<div />}>
            <DateRangePicker
              onDatesChange={({startDate, endDate}) => {
                setStartDate(startDate);
                setEndDate(endDate);
              }}
              onFocusChange={(focusedInput) => {
                focusedInput && setFocusedInput(focusedInput);
              }}
              startDate={startDate}
              endDate={endDate}
              startDateId="start"
              endDateId="end"
              focusedInput={focusedInput}
              withPortal={false}
              keepOpenOnDateSelect
              isOutsideRange={() => false}
            />
          </Suspense>
        </Box>
      </Container>
      <DialogFooter topBorder>
        <Button
          onClick={() => {
            setIsOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button
          intent="primary"
          disabled={!startDate || !endDate}
          onClick={() => {
            filter.setState([startDate!.valueOf(), endDate!.valueOf()]);
            setIsOpen(false);
          }}
        >
          Apply
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

const Container = styled.div`
  height: 430px;

  /* Hide the default date picker for Chrome, Edge, and Safari */
  input[type='date']::-webkit-calendar-picker-indicator {
    display: none;
  }

  /* Hide the default date picker for Firefox */
  input[type='date']::-moz-calendar-picker-indicator {
    display: none;
  }

  /* Hide the default date picker for Internet Explorer */
  input[type='date']::-ms-calendar-picker-indicator {
    display: none;
  }

  .DayPickerKeyboardShortcuts_show {
    display: none;
  }

  .CalendarDay__hovered_span,
  .CalendarDay__hovered_span:hover,
  .CalendarDay__selected_span,
  .CalendarDay__selected_span:hover {
    background: ${Colors.backgroundBlue()};
    color: ${Colors.textBlue()};
    border: 1px solid #e4e7e7;
  }
  .CalendarDay__selected,
  .CalendarDay__selected:active,
  .CalendarDay__selected:hover {
    background: ${Colors.backgroundBlueHover()};
    border: 1px solid #e4e7e7;
  }
  .DateInput_input__focused {
    border-color: ${Colors.borderDefault()};
  }
`;

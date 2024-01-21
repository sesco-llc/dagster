import {gql} from '@apollo/client';
import {Box, Colors, Tag, Tooltip} from '@dagster-io/ui-components';
import {Spacing} from '@dagster-io/ui-components/src/components/types';
import styled from 'styled-components';

import {ConstraintsForTableColumnFragment, TableSchemaFragment} from './types/TableSchema.types';

// export type ITableSchemaMetadataEntry = TableSchemaForMetadataEntryFragment;
type ITableSchema = TableSchemaFragment;
type ColumnConstraints = ConstraintsForTableColumnFragment;

const MAX_CONSTRAINT_TAG_CHARS = 30;

interface ITableSchemaProps {
  schema: ITableSchema;
  itemHorizontalPadding?: Spacing;
}

export const TableSchema = ({schema, itemHorizontalPadding}: ITableSchemaProps) => {
  const multiColumnConstraints = schema.constraints?.other || [];
  return (
    <div>
      {multiColumnConstraints.length > 0 && (
        <Box
          flex={{
            wrap: 'wrap',
            gap: 4,
            alignItems: 'center',
          }}
          padding={{horizontal: itemHorizontalPadding, vertical: 8}}
        >
          {multiColumnConstraints.map((constraint, i) => (
            <ArbitraryConstraintTag key={i} constraint={constraint} />
          ))}
        </Box>
      )}
      {schema.columns.map((column) => {
        return (
          <ColumnItem
            key={column.name}
            name={column.name}
            type={column.type}
            description={column.description || undefined}
            constraints={column.constraints}
            horizontalPadding={itemHorizontalPadding || 8}
          />
        );
      })}
    </div>
  );
};

const _ColumnItem = ({
  name,
  type,
  description,
  constraints,
  className,
}: {
  name: string;
  type: string;
  description?: string;
  constraints: ColumnConstraints;
  horizontalPadding: number;
  className?: string;
}) => {
  return (
    <div className={className}>
      <Box flex={{wrap: 'wrap', gap: 4, alignItems: 'center'}}>
        <ColumnName>{name}</ColumnName>
        <TypeTag type={type} />
        {!constraints.nullable && NonNullableTag}
        {constraints.unique && UniqueTag}
        {constraints.other.map((constraint, i) => (
          <ArbitraryConstraintTag key={i} constraint={constraint} />
        ))}
      </Box>
      {description && <Box>{description}</Box>}
    </div>
  );
};

const ColumnItem = styled(_ColumnItem)`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px ${(props) => props.horizontalPadding}px;
  border-top: 1px solid ${Colors.keylineDefault()};
  :first-child {
    border-top: none;
  }
  font-size: 12px;
`;

const ColumnName = styled.div`
  font-weight: 600;
  padding-right: 4px;
`;

const TypeTag = ({type}: {type: string}) => <Tag intent="none">{type}</Tag>;

const NonNullableTag = <Tag intent="primary">non-nullable</Tag>;

const UniqueTag = <Tag intent="primary">unique</Tag>;

const ArbitraryConstraintTag = ({constraint}: {constraint: string}) => {
  if (constraint.length > MAX_CONSTRAINT_TAG_CHARS) {
    const content = constraint.substring(0, MAX_CONSTRAINT_TAG_CHARS - 3) + '...';
    return (
      <Tooltip content={<div>{constraint}</div>}>
        <Tag intent="primary">{content}</Tag>
      </Tooltip>
    );
  } else {
    return <Tag intent="primary">{constraint}</Tag>;
  }
};

export const TABLE_SCHEMA_FRAGMENT = gql`
  fragment TableSchemaFragment on TableSchema {
    columns {
      name
      description
      type
      constraints {
        ...ConstraintsForTableColumn
      }
    }
    constraints {
      other
    }
  }

  fragment ConstraintsForTableColumn on TableColumnConstraints {
    nullable
    unique
    other
  }
`;

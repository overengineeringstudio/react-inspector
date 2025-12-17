import React, { FC } from 'react';
import { useSchemaContext } from './SchemaContext';

export interface SchemaAwareNodeRendererProps {
  /** Original ObjectRootLabel component */
  ObjectRootLabel: FC<{ name?: string; data: unknown }>;
  /** Original ObjectLabel component */
  ObjectLabel: FC<{ name: string; data: unknown; isNonenumerable?: boolean }>;
  /** Original ObjectName component */
  ObjectName: FC<{ name: string; dimmed?: boolean }>;
  /** Original ObjectValue component */
  ObjectValue: FC<{ object: unknown }>;
  /** Original ObjectPreview component */
  ObjectPreview: FC<{ data: unknown }>;
}

/**
 * Creates a schema-aware node renderer that uses schema annotations for display.
 * Uses path-based schema lookup to resolve the correct schema for any node
 * in the tree, including deeply nested fields.
 */
export const createSchemaAwareNodeRenderer = ({
  ObjectName,
  ObjectValue,
  ObjectPreview,
}: SchemaAwareNodeRendererProps) => {
  /** Schema-aware ObjectValue that uses pretty print and display name */
  const SchemaAwareObjectValue: FC<{ object: unknown; path: string }> = ({ object, path }) => {
    const rootCtx = useSchemaContext();
    const schemaCtx = rootCtx.getContextForPath(path);

    const prettyFormatted = schemaCtx.formatValue(object);
    if (prettyFormatted !== undefined) {
      return <span>{prettyFormatted}</span>;
    }

    if (
      typeof object === 'object' &&
      object !== null &&
      !(object instanceof Date) &&
      !(object instanceof RegExp) &&
      !Array.isArray(object)
    ) {
      const schemaDisplayName = schemaCtx.getDisplayName();
      if (schemaDisplayName && object.constructor?.name === 'Object') {
        return <span>{schemaDisplayName}</span>;
      }
    }

    return <ObjectValue object={object} />;
  };

  /** Schema-aware ObjectPreview that uses schema annotations */
  const SchemaAwareObjectPreview: FC<{ data: unknown; path: string }> = ({ data, path }) => {
    const rootCtx = useSchemaContext();
    const schemaCtx = rootCtx.getContextForPath(path);

    const prettyFormatted = schemaCtx.formatValue(data);
    if (prettyFormatted !== undefined) {
      return <span>{prettyFormatted}</span>;
    }

    return <ObjectPreview data={data} />;
  };

  /** Schema-aware ObjectLabel that uses path-based schema lookup */
  const SchemaAwareObjectLabel: FC<{
    name: string;
    data: unknown;
    path: string;
    isNonenumerable?: boolean;
  }> = ({ name, data, path, isNonenumerable = false }) => {
    return (
      <span>
        {typeof name === 'string' ? (
          <ObjectName name={name} dimmed={isNonenumerable} />
        ) : (
          <SchemaAwareObjectPreview data={name} path={path} />
        )}
        <span>: </span>
        <SchemaAwareObjectValue object={data} path={path} />
      </span>
    );
  };

  /** Schema-aware ObjectRootLabel */
  const SchemaAwareObjectRootLabel: FC<{ name?: string; data: unknown; path: string }> = ({ name, data, path }) => {
    const rootCtx = useSchemaContext();
    const schemaCtx = rootCtx.getContextForPath(path);

    const prettyFormatted = schemaCtx.formatValue(data);
    if (prettyFormatted !== undefined) {
      if (typeof name === 'string') {
        return (
          <span>
            <ObjectName name={name} />
            <span>: </span>
            <span>{prettyFormatted}</span>
          </span>
        );
      }
      return <span>{prettyFormatted}</span>;
    }

    const schemaDisplayName = schemaCtx.getDisplayName();

    if (typeof name === 'string') {
      return (
        <span>
          <ObjectName name={name} />
          <span>: </span>
          <SchemaAwareObjectPreviewWithName data={data} schemaDisplayName={schemaDisplayName} />
        </span>
      );
    }

    return <SchemaAwareObjectPreviewWithName data={data} schemaDisplayName={schemaDisplayName} />;
  };

  /** Helper for root preview with schema name */
  const SchemaAwareObjectPreviewWithName: FC<{
    data: unknown;
    schemaDisplayName?: string;
  }> = ({ data, schemaDisplayName }) => {
    if (
      schemaDisplayName &&
      typeof data === 'object' &&
      data !== null &&
      !(data instanceof Date) &&
      !(data instanceof RegExp) &&
      data.constructor?.name === 'Object'
    ) {
      return (
        <span>
          <span style={{ fontStyle: 'italic' }}>{schemaDisplayName} </span>
          <ObjectPreview data={data} />
        </span>
      );
    }

    return <ObjectPreview data={data} />;
  };

  /**
   * The node renderer function to pass to ObjectInspector.
   * Uses the `path` prop to resolve the correct schema for each node.
   */
  const schemaAwareNodeRenderer = ({
    depth,
    name,
    data,
    path,
    isNonenumerable,
  }: {
    depth: number;
    name: string;
    data: unknown;
    path: string;
    isNonenumerable?: boolean;
  }) => {
    if (depth === 0) {
      return <SchemaAwareObjectRootLabel name={name} data={data} path={path} />;
    }

    return <SchemaAwareObjectLabel name={name} data={data} path={path} isNonenumerable={isNonenumerable} />;
  };

  return schemaAwareNodeRenderer;
};

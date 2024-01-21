import {Alert, Colors, Icon} from '@dagster-io/ui-components';

export const AssetChecksBanner = () => {
  return (
    <Alert
      intent="info"
      title="Asset Checks are experimental"
      icon={<Icon name="info" color={Colors.accentBlue()} />}
      description={
        <span>
          You can learn more about this new feature and provide feedback{' '}
          <a href="https://github.com/dagster-io/dagster/discussions/16266">here</a>.
        </span>
      }
    />
  );
};

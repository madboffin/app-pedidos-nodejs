import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {environment} from '../config/environments';

const config = {
  name: 'mongodbatlas',
  connector: 'mongodb',
  url: `mongodb+srv://${environment.mongodbconn}@clusterpweb.oxzlmpb.mongodb.net/testDbMongo?retryWrites=true&w=majority`,
  host: '',
  port: 0,
  user: '',
  password: '',
  database: '',
  useNewUrlParser: true
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MongodbatlasDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'mongodbatlas';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.mongodbatlas', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}

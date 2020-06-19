import { resolve } from 'path';
import { connect } from './db';
import { getPubSub } from './pubsub'
import { Config } from './config/config';
import { ApolloServer } from "apollo-server-express";
import { Express } from "express";
import scalars from './resolvers/scalars';
import customResolvers from './resolvers/custom';
import { buildKeycloakApolloConfig } from './auth';
import { AMQCRUDService } from './AMQCrudService'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadSchemaSync } from '@graphql-tools/load'
import { buildGraphbackAPI } from "graphback"
import { DataSyncPlugin, createDataSyncMongoDbProvider, createDataSyncCRUDService } from "@graphback/datasync"
/**
 * Creates Apollo server
 */
export const createApolloServer = async function (app: Express, config: Config) {
    const db = await connect(config);
    const pubSub = getPubSub();

    const modelDefs = loadSchemaSync(resolve(__dirname, '../model/task.graphql'), {
        loaders: [
            new GraphQLFileLoader()
        ]
    })

    const { typeDefs, resolvers, contextCreator } = buildGraphbackAPI(modelDefs, {
        serviceCreator: createDataSyncCRUDService({
            pubSub: getPubSub()
        }),
        dataProviderCreator: createDataSyncMongoDbProvider(db),
        plugins: [
            new DataSyncPlugin()
        ]
    });

    let apolloConfig = {
        typeDefs: [typeDefs],
        resolvers,
        playground: true,
        context: contextCreator
    }

    if (config.keycloakConfig) {
        apolloConfig = buildKeycloakApolloConfig(app, apolloConfig)
    }


    apolloConfig.resolvers = { ...apolloConfig.resolvers, ...scalars, ...customResolvers };

    const apolloServer = new ApolloServer(apolloConfig)
    apolloServer.applyMiddleware({ app });

    return apolloServer;
}

import { GraphbackOperationType } from '@graphback/core'
import { KeycloakCrudService, CrudServiceAuthConfig, KeycloakCrudServiceOptions } from '@graphback/keycloak-authz'
import { ModelDefinition, GraphbackDataProvider, GraphbackCRUDService } from 'graphback';
import { createDataSyncCRUDService, DataSyncProvider } from '@graphback/datasync';
import { getPubSub } from './pubsub';

/**
 * Creates Graphback service with following capabilities:
 * 
 * - DataSync
 * - Keycloak
 * - AMQ custom topics
 * 
 * @param authConfig 
 */
export function createKeycloakAndAMQCRUDService(authConfig: Map<string,CrudServiceAuthConfig>) {
    const pubSub = getPubSub();
    return (model: ModelDefinition, dataProvider: DataSyncProvider): GraphbackCRUDService => {
        const service = createDataSyncCRUDService({
            pubSub
        })(model, dataProvider);
        const objConfig = authConfig[model.graphqlType.name];
        const keycloakService = new AMQCRUDService({ service, authConfig: objConfig });

        return keycloakService;
    }
}


export class AMQCRUDService extends KeycloakCrudService {
    constructor(options: KeycloakCrudServiceOptions) {
        super(options);
    }
    protected subscriptionTopicMapping(triggerType: GraphbackOperationType, objectName: string) {
        // Support AMQ topic creation format
        return `graphql/${objectName}_${triggerType}`
    }
}
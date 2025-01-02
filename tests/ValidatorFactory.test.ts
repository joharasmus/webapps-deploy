import { ActionParameters } from "../src/actionparameters";
import { ValidatorFactory } from '../src/ActionInputValidator/ValidatorFactory';
import { DEPLOYMENT_PROVIDER_TYPES } from "../src/DeploymentProvider/Providers/BaseWebAppDeploymentProvider";
import { PublishProfileContainerWebAppValidator } from "../src/ActionInputValidator/ActionValidators/PublishProfileContainerWebAppValidator";
import { PublishProfileWebAppValidator } from "../src/ActionInputValidator/ActionValidators/PublishProfileWebAppValidator";
import { PublishProfile } from "../src/Utilities/PublishProfile";

describe('Test Validator Factory', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Test webapps-deploy for publish-profile', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it("Get Code Validator for Publish Profile auth flow", async() => {
            let type: DEPLOYMENT_PROVIDER_TYPES = DEPLOYMENT_PROVIDER_TYPES.PUBLISHPROFILE;
            
            jest.spyOn(PublishProfile, 'getPublishProfile').mockImplementation(() => PublishProfile.prototype);
            jest.spyOn(PublishProfile.prototype, 'getAppOS').mockImplementation(async() => 'unix');
    
            let validator = await ValidatorFactory.getValidator(type);
            expect(validator).toBeInstanceOf(PublishProfileWebAppValidator);
        });
    
        it("Get Container Validator for Publish Profile auth flow", async() => {
            jest.spyOn(ActionParameters, 'getActionParams').mockImplementation(() : any => {
                return {
                    images : 'MOCK_IMAGES'
                }
            });

            let type: DEPLOYMENT_PROVIDER_TYPES = DEPLOYMENT_PROVIDER_TYPES.PUBLISHPROFILE;
            
            jest.spyOn(PublishProfile, 'getPublishProfile').mockImplementation(() => PublishProfile.prototype);
            jest.spyOn(PublishProfile.prototype, 'getAppOS').mockImplementation(async() => 'unix');
    
            let validator = await ValidatorFactory.getValidator(type);
            expect(validator).toBeInstanceOf(PublishProfileContainerWebAppValidator);
        });
        
    });
    
});
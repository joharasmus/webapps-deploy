import { DeploymentProviderFactory } from '../src/DeploymentProvider/DeploymentProviderFactory';
import { DEPLOYMENT_PROVIDER_TYPES } from "../src/DeploymentProvider/Providers/BaseWebAppDeploymentProvider";
import { WebAppDeploymentProvider } from "../src/DeploymentProvider/Providers/WebAppDeploymentProvider";


describe('Test Deployment Provider Factory', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Test Deployment Provider for publish-profile', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it("Get Code Deployment Provider for Publish Profile auth flow", async() => {
            let type: DEPLOYMENT_PROVIDER_TYPES = DEPLOYMENT_PROVIDER_TYPES.PUBLISHPROFILE;
    
            let provider = await DeploymentProviderFactory.getDeploymentProvider(type);
            expect(provider).toBeInstanceOf(WebAppDeploymentProvider);
        });
        
    });

    });
;
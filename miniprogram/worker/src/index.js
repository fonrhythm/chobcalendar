import auth from './auth.js';
import feed from './feed.js';
export {identityEmail} from './auth.js';
export default {fetch(request,env,ctx){return new URL(request.url).pathname==='/feed'?feed.fetch(request,env,ctx):auth.fetch(request,env,ctx)}};

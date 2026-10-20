import auth from './auth.js';
import feed from './feed.js';
import { WorkerEntrypoint } from 'cloudflare:workers';
import { getBoundFeed } from './boundFeed.js';
export {identityEmail} from './auth.js';
export class CalendarFeed extends WorkerEntrypoint {
  getFeed(rawBody, ip) { return getBoundFeed(rawBody, ip, this.env); }
}
export default {fetch(request,env,ctx){return new URL(request.url).pathname==='/feed'?feed.fetch(request,env,ctx):auth.fetch(request,env,ctx)}};

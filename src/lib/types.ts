import type { Logger } from 'pino'
import type { User } from '../db/schemas/user'

export interface AppBindings {
  Variables: {
    logger: Logger
    user?: User
  }
};

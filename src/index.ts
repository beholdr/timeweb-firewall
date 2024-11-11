import { getState } from '@actions/core'
import { run, cleanup } from './main'

if (getState('ruleId')) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  cleanup()
} else {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  run()
}

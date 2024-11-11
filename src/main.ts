import * as core from '@actions/core'
import { HttpClient, HttpClientError } from '@actions/http-client'

interface IPResponse {
  ip: string
}

interface AddRuleResponse {
  rule: {
    id: string
  }
}

const IP_API_HOST = 'https://api64.ipify.org'
const TIMEWEB_API_HOST = 'https://api.timeweb.cloud'

export async function run(): Promise<void> {
  try {
    const ip = await getRunnerIp()

    const rule = await addFirewallRule(ip)

    core.saveState('ruleId', rule)

    core.info(`Timeweb firewall rule for ${ip} has been added!`)
  } catch (error) {
    if (
      error instanceof HttpClientError &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      error.result?.error_code === 'already_exist'
    ) {
      core.saveState('ruleId', 'SKIP')
      core.notice(`Timeweb firewall rule already exist`)
    } else if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

export async function cleanup(): Promise<void> {
  try {
    const rule = core.getState('ruleId')

    if (rule === 'SKIP') {
      core.saveState('ruleId', '')
      return
    }

    const result = await deleteFirewallRule(rule)

    if (!result) {
      throw new Error('Error while deleting a firewall rule')
    }

    core.saveState('ruleId', '')

    core.info(`Timeweb firewall rule is deleted!`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function getRunnerIp(): Promise<string> {
  const http = buildHttpClient()

  const response = await http.getJson<IPResponse>(`${IP_API_HOST}?format=json`)

  if (!response.result?.ip) {
    throw new Error('Error while determining a runner IP')
  }

  return response.result.ip
}

async function addFirewallRule(cidr: string): Promise<string> {
  const firewall = core.getInput('firewall')
  const token = core.getInput('token')
  const port = core.getInput('port')
  const protocol = core.getInput('protocol')

  const payload = {
    direction: 'ingress',
    protocol,
    port,
    cidr
  }

  const http = buildHttpClient()
  const url = `${TIMEWEB_API_HOST}/api/v1/firewall/groups/${firewall}/rules`
  const headers = { Authorization: `Bearer ${token}` }

  const response = await http.postJson<AddRuleResponse>(url, payload, headers)

  if (!response.result?.rule.id) {
    throw new Error('Error while adding a firewall rule')
  }

  return response.result.rule.id
}

async function deleteFirewallRule(rule: string): Promise<boolean> {
  const firewall = core.getInput('firewall')
  const token = core.getInput('token')

  const http = buildHttpClient()
  const url = `${TIMEWEB_API_HOST}/api/v1/firewall/groups/${firewall}/rules/${rule}`
  const headers = { Authorization: `Bearer ${token}` }

  await http.del(url, headers)

  return true
}

function buildHttpClient(): HttpClient {
  return new HttpClient('beholdr/timeweb-firewall', undefined, {
    allowRetries: true,
    maxRetries: 2
  })
}

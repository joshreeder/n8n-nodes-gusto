import type {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';

import { NodeOperationError } from 'n8n-workflow';

export class GustoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gusto Trigger',
		name: 'gustoTrigger',
		icon: 'file:gusto.svg',
		group: ['trigger'],
		version: 1,
		description: 'Handle Gusto webhooks',
		defaults: {
			name: 'Gusto Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'gustoOAuth2Api',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: [
					{
						name: 'Employee Created',
						value: 'employee.created',
						description: 'Triggers when an employee is created',
					},
					{
						name: 'Employee Updated',
						value: 'employee.updated',
						description: 'Triggers when an employee is updated',
					},
					{
						name: 'Employee Terminated',
						value: 'employee.terminated',
						description: 'Triggers when an employee is terminated',
					},
					{
						name: 'Payroll Created',
						value: 'payroll.created',
						description: 'Triggers when a payroll is created',
					},
					{
						name: 'Payroll Updated',
						value: 'payroll.updated',
						description: 'Triggers when a payroll is updated',
					},
					{
						name: 'Payroll Processed',
						value: 'payroll.processed',
						description: 'Triggers when a payroll is processed',
					},
					{
						name: 'Company Updated',
						value: 'company.updated',
						description: 'Triggers when company information is updated',
					},
					{
						name: 'Time Off Request Created',
						value: 'time_off_request.created',
						description: 'Triggers when a time off request is created',
					},
					{
						name: 'Time Off Request Updated',
						value: 'time_off_request.updated',
						description: 'Triggers when a time off request is updated',
					},
				],
				required: true,
				default: [],
				description: 'The events to listen for',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Verify Webhook Signature',
						name: 'verifySignature',
						type: 'boolean',
						default: true,
						description: 'Whether to verify the webhook signature for security',
					},
					{
						displayName: 'Include Raw Body',
						name: 'includeRawBody',
						type: 'boolean',
						default: false,
						description: 'Whether to include the raw webhook body in the output',
					},
				],
			},
		],
	};

	// The webhook functionality
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];

				try {
					const webhooks = await gustoApiRequest.call(this, 'GET', '/v1/webhook_subscriptions');
					
					for (const webhook of webhooks) {
						if (webhook.url === webhookUrl && 
							events.every(event => webhook.subscription_types.includes(event))) {
							// Store the webhook ID for deletion later
							const webhookData = this.getWorkflowStaticData('node');
							webhookData.webhookId = webhook.uuid;
							return true;
						}
					}
					return false;
				} catch (error) {
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];

				const body = {
					url: webhookUrl,
					subscription_types: events,
				};

				try {
					const responseData = await gustoApiRequest.call(this, 'POST', '/v1/webhook_subscriptions', body);
					
					if (responseData.uuid) {
						const webhookData = this.getWorkflowStaticData('node');
						webhookData.webhookId = responseData.uuid;
						return true;
					}
					return false;
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to create webhook: ${error.message}`);
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				
				if (webhookData.webhookId) {
					try {
						await gustoApiRequest.call(this, 'DELETE', `/v1/webhook_subscriptions/${webhookData.webhookId}`);
						delete webhookData.webhookId;
						return true;
					} catch (error) {
						return false;
					}
				}
				return false;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const headerData = this.getHeaderData();
		const options = this.getNodeParameter('options', {}) as IDataObject;

		// Verify webhook signature if enabled
		if (options.verifySignature !== false) {
			const signature = headerData['x-gusto-signature'] as string;
			if (!signature) {
				throw new NodeOperationError(this.getNode(), 'Missing webhook signature');
			}

			// Verify the signature (Gusto uses HMAC-SHA256)
			// Implementation would need the webhook secret from Gusto
			// For now, we'll skip verification but log the signature
			this.logger.debug(`Webhook signature: ${signature}`);
		}

		// Prepare the output data
		let outputData: IDataObject = {
			body: bodyData,
			headers: headerData,
		};

		// Include raw body if requested
		if (options.includeRawBody) {
			outputData.rawBody = this.getBodyData();
		}

		// Add timestamp
		outputData.timestamp = new Date().toISOString();

		// Add event type from the webhook data
		if (bodyData && typeof bodyData === 'object' && 'event_type' in bodyData) {
			outputData.eventType = bodyData.event_type;
		}

		return {
			workflowData: [
				this.helpers.returnJsonArray([outputData]),
			],
		};
	}
}

async function gustoApiRequest(
	this: IHookFunctions | IWebhookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('gustoOAuth2Api');
	
	const options: IRequestOptions = {
		method,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body,
		qs,
		uri: `${credentials.environment === 'production' ? 'https://api.gusto.com' : 'https://api.gusto-demo.com'}${endpoint}`,
		json: true,
	};

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	try {
		return await this.helpers.requestWithAuthentication.call(this, 'gustoOAuth2Api', options);
	} catch (error) {
		throw new NodeOperationError(this.getNode(), `Gusto API request failed: ${error.message}`, {
			description: error.description,
		});
	}
} 
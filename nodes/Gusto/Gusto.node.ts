import type {
	IExecuteFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';

import { NodeOperationError } from 'n8n-workflow';

export class Gusto implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gusto',
		name: 'gusto',
		icon: 'file:gusto.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Gusto HR and Payroll API',
		defaults: {
			name: 'Gusto',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'gustoOAuth2Api',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.environment === "production" ? "https://api.gusto.com" : "https://api.gusto-demo.com"}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Company',
						value: 'company',
					},
					{
						name: 'Employee',
						value: 'employee',
					},
					{
						name: 'Payroll',
						value: 'payroll',
					},
					{
						name: 'Pay Schedule',
						value: 'paySchedule',
					},
					{
						name: 'Time Off Request',
						value: 'timeOffRequest',
					},
					{
						name: 'Webhook',
						value: 'webhook',
					},
				],
				default: 'company',
			},

			// Company Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['company'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a company',
						action: 'Get a company',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get many companies',
						action: 'Get many companies',
					},
				],
				default: 'get',
			},

			// Employee Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['employee'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create an employee',
						action: 'Create an employee',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an employee',
						action: 'Get an employee',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get many employees',
						action: 'Get many employees',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an employee',
						action: 'Update an employee',
					},
					{
						name: 'Terminate',
						value: 'terminate',
						description: 'Terminate an employee',
						action: 'Terminate an employee',
					},
				],
				default: 'get',
			},

			// Payroll Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['payroll'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a payroll',
						action: 'Get a payroll',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get many payrolls',
						action: 'Get many payrolls',
					},
					{
						name: 'Process',
						value: 'process',
						description: 'Process a payroll',
						action: 'Process a payroll',
					},
				],
				default: 'get',
			},

			// Pay Schedule Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['paySchedule'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a pay schedule',
						action: 'Get a pay schedule',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get many pay schedules',
						action: 'Get many pay schedules',
					},
				],
				default: 'get',
			},

			// Time Off Request Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['timeOffRequest'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a time off request',
						action: 'Get a time off request',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get many time off requests',
						action: 'Get many time off requests',
					},
					{
						name: 'Approve',
						value: 'approve',
						description: 'Approve a time off request',
						action: 'Approve a time off request',
					},
					{
						name: 'Deny',
						value: 'deny',
						description: 'Deny a time off request',
						action: 'Deny a time off request',
					},
				],
				default: 'get',
			},

			// Webhook Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a webhook subscription',
						action: 'Create a webhook subscription',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a webhook subscription',
						action: 'Delete a webhook subscription',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a webhook subscription',
						action: 'Get a webhook subscription',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get many webhook subscriptions',
						action: 'Get many webhook subscriptions',
					},
				],
				default: 'get',
			},

			// Company fields
			{
				displayName: 'Company ID',
				name: 'companyId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'The ID of the company to retrieve',
			},

			// Employee fields
			{
				displayName: 'Company ID',
				name: 'companyId',
				type: 'options',
				required: true,
				typeOptions: {
					loadOptionsMethod: 'getCompanies',
				},
				displayOptions: {
					show: {
						resource: ['employee'],
						operation: ['create', 'getMany'],
					},
				},
				default: '',
				description: 'The ID of the company',
			},
			{
				displayName: 'Employee ID',
				name: 'employeeId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['employee'],
						operation: ['get', 'update', 'terminate'],
					},
				},
				default: '',
				description: 'The ID of the employee',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['employee'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The employee\'s first name',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['employee'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The employee\'s last name',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['employee'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The employee\'s email address',
			},
			{
				displayName: 'Date of Birth',
				name: 'dateOfBirth',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['employee'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The employee\'s date of birth (YYYY-MM-DD)',
			},
			{
				displayName: 'Social Security Number',
				name: 'ssn',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['employee'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The employee\'s social security number',
			},

			// Payroll fields
			{
				displayName: 'Company ID',
				name: 'companyId',
				type: 'options',
				required: true,
				typeOptions: {
					loadOptionsMethod: 'getCompanies',
				},
				displayOptions: {
					show: {
						resource: ['payroll'],
						operation: ['getMany'],
					},
				},
				default: '',
				description: 'The ID of the company',
			},
			{
				displayName: 'Payroll ID',
				name: 'payrollId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['payroll'],
						operation: ['get', 'process'],
					},
				},
				default: '',
				description: 'The ID of the payroll',
			},

			// Additional options
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['employee'],
						operation: ['create', 'update'],
					},
				},
				options: [
					{
						displayName: 'Middle Initial',
						name: 'middleInitial',
						type: 'string',
						default: '',
						description: 'The employee\'s middle initial',
					},
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
						description: 'The employee\'s phone number',
					},
					{
						displayName: 'Preferred First Name',
						name: 'preferredFirstName',
						type: 'string',
						default: '',
						description: 'The employee\'s preferred first name',
					},
					{
						displayName: 'Work Email',
						name: 'workEmail',
						type: 'string',
						default: '',
						description: 'The employee\'s work email address',
					},
				],
			},

			// Webhook fields
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'The URL where webhooks will be sent',
			},
			{
				displayName: 'Event Types',
				name: 'eventTypes',
				type: 'multiOptions',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create'],
					},
				},
				options: [
					{
						name: 'Employee Created',
						value: 'employee.created',
					},
					{
						name: 'Employee Updated',
						value: 'employee.updated',
					},
					{
						name: 'Employee Terminated',
						value: 'employee.terminated',
					},
					{
						name: 'Payroll Created',
						value: 'payroll.created',
					},
					{
						name: 'Payroll Updated',
						value: 'payroll.updated',
					},
					{
						name: 'Payroll Processed',
						value: 'payroll.processed',
					},
				],
				default: [],
				description: 'The types of events to subscribe to',
			},
			{
				displayName: 'Webhook ID',
				name: 'webhookId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['get', 'delete'],
					},
				},
				default: '',
				description: 'The ID of the webhook subscription',
			},
		],
	};

	methods = {
		loadOptions: {
			// Get companies for dropdown
			async getCompanies(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const companies = await gustoApiRequest.call(this, 'GET', '/v1/companies');
				for (const company of companies) {
					returnData.push({
						name: company.name,
						value: company.uuid,
					});
				}
				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const length = items.length;

		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		for (let i = 0; i < length; i++) {
			try {
				let responseData;

				if (resource === 'company') {
					if (operation === 'get') {
						const companyId = this.getNodeParameter('companyId', i) as string;
						responseData = await gustoApiRequest.call(this, 'GET', `/v1/companies/${companyId}`);
					} else if (operation === 'getMany') {
						responseData = await gustoApiRequest.call(this, 'GET', '/v1/companies');
					}
				} else if (resource === 'employee') {
					if (operation === 'create') {
						const companyId = this.getNodeParameter('companyId', i) as string;
						const body: IDataObject = {
							first_name: this.getNodeParameter('firstName', i),
							last_name: this.getNodeParameter('lastName', i),
							email: this.getNodeParameter('email', i),
						};

						const dateOfBirth = this.getNodeParameter('dateOfBirth', i) as string;
						if (dateOfBirth) {
							body.date_of_birth = dateOfBirth;
						}

						const ssn = this.getNodeParameter('ssn', i) as string;
						if (ssn) {
							body.ssn = ssn;
						}

						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
						Object.assign(body, additionalFields);

						responseData = await gustoApiRequest.call(this, 'POST', `/v1/companies/${companyId}/employees`, body);
					} else if (operation === 'get') {
						const employeeId = this.getNodeParameter('employeeId', i) as string;
						responseData = await gustoApiRequest.call(this, 'GET', `/v1/employees/${employeeId}`);
					} else if (operation === 'getMany') {
						const companyId = this.getNodeParameter('companyId', i) as string;
						responseData = await gustoApiRequest.call(this, 'GET', `/v1/companies/${companyId}/employees`);
					} else if (operation === 'update') {
						const employeeId = this.getNodeParameter('employeeId', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
						responseData = await gustoApiRequest.call(this, 'PUT', `/v1/employees/${employeeId}`, additionalFields);
					} else if (operation === 'terminate') {
						const employeeId = this.getNodeParameter('employeeId', i) as string;
						const terminationDate = this.getNodeParameter('terminationDate', i) as string;
						const body = {
							termination_date: terminationDate,
						};
						responseData = await gustoApiRequest.call(this, 'PUT', `/v1/employees/${employeeId}/terminations`, body);
					}
				} else if (resource === 'payroll') {
					if (operation === 'get') {
						const payrollId = this.getNodeParameter('payrollId', i) as string;
						responseData = await gustoApiRequest.call(this, 'GET', `/v1/payrolls/${payrollId}`);
					} else if (operation === 'getMany') {
						const companyId = this.getNodeParameter('companyId', i) as string;
						responseData = await gustoApiRequest.call(this, 'GET', `/v1/companies/${companyId}/payrolls`);
					} else if (operation === 'process') {
						const payrollId = this.getNodeParameter('payrollId', i) as string;
						responseData = await gustoApiRequest.call(this, 'PUT', `/v1/payrolls/${payrollId}/submit`);
					}
				} else if (resource === 'paySchedule') {
					if (operation === 'get') {
						const scheduleId = this.getNodeParameter('scheduleId', i) as string;
						responseData = await gustoApiRequest.call(this, 'GET', `/v1/pay_schedules/${scheduleId}`);
					} else if (operation === 'getMany') {
						const companyId = this.getNodeParameter('companyId', i) as string;
						responseData = await gustoApiRequest.call(this, 'GET', `/v1/companies/${companyId}/pay_schedules`);
					}
				} else if (resource === 'webhook') {
					if (operation === 'create') {
						const webhookUrl = this.getNodeParameter('webhookUrl', i) as string;
						const eventTypes = this.getNodeParameter('eventTypes', i) as string[];
						const body = {
							url: webhookUrl,
							subscription_types: eventTypes,
						};
						responseData = await gustoApiRequest.call(this, 'POST', '/v1/webhook_subscriptions', body);
					} else if (operation === 'get') {
						const webhookId = this.getNodeParameter('webhookId', i) as string;
						responseData = await gustoApiRequest.call(this, 'GET', `/v1/webhook_subscriptions/${webhookId}`);
					} else if (operation === 'getMany') {
						responseData = await gustoApiRequest.call(this, 'GET', '/v1/webhook_subscriptions');
					} else if (operation === 'delete') {
						const webhookId = this.getNodeParameter('webhookId', i) as string;
						responseData = await gustoApiRequest.call(this, 'DELETE', `/v1/webhook_subscriptions/${webhookId}`);
					}
				}

				if (Array.isArray(responseData)) {
					returnData.push.apply(returnData, responseData);
				} else {
					returnData.push(responseData as IDataObject);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}

async function gustoApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
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
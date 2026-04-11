Follow the Airtable personal access token (PAT) setup flow to register a PAT.

Create the app with the following scopes:

Data.records:read

Data.records:write

schema.bases:read

schema.bases:write

Copy your PAT.

In your AI assistant's MCP configuration, enter:

Server URL: https://mcp.airtable.com/mcp

Custom “Authorization” header: “Bearer [your personal access token]”

For Claude Code, run this command in your terminal: claude mcp add --transport http airtable https://mcp.airtable.com/mcp --header "Authorization: Bearer [your personal access token]"

Managing your MCP integration
After setup, you can control which bases your AI assistant can access:

Click on your user profile in Airtable

Navigate to Integrations > Third-party Integrations

Select your MCP integration

Add or remove bases as needed

Available MCP capabilities
Currently, the MCP server provides these tools:

Tool name

Description

create_table

Creates a new table in an Airtable base. To get the baseId, use the list_bases or search_bases tools first.

create_field

Creates a new field in an existing Airtable table. To get baseId and tableId, use the search_bases and list_tables_for_base tools first.

update_table

Updates an existing table's name and/or description in an Airtable base. To get baseId and tableId, use the search_bases and list_tables_for_base tools first.

update_field

Updates the name and/or description of a field in an existing Airtable table. To get baseId, tableId, and fieldId, use the get_table_schema tool first.

create_records_for_table

Creates new records in an Airtable table. To get baseId and tableId, use the search_bases and list_tables_for_base tools first.

get_table_schema

Gets the detailed schema information for specified tables and fields in a base. This returns the field ID, type, and config for the specified fields of the specified tables.

list_bases

Lists all bases (applications) that you have access to in your Airtable account. Use this to get the baseId of the base you want to use. Favorited and recently viewed bases are generally more relevant.

list_records_for_table

Lists records queried from an Airtable table. Do not assume baseId and tableId. Obtain these from search_bases → list_tables_for_base. Do not attempt to pass filterByFormula. Look carefully at the filters parameter.

Pre-requisite: If filtering on select/multiSelect fields, you must call get_table_schema first to get the choice IDs. Aim to provide at least 6 relevant fields via the fieldIds parameter.

list_tables_for_base

Gets the summary of a specific base (application). This includes the schemas of all tables in the base, including field name and type.

ping

Ping the MCP server to check if it is running

search_bases

Searches for bases (applications) by name. This is useful when you need to find a specific base quickly by a partial name-based match. Returns bases sorted by their relevance score, as well as a recommended base ID and a hint on whether we need to ask the user to explicitly select the base they want to use.

update_records_for_table

Updates records in an Airtable table. The fields you specify will be updated, and all other fields will be left unchanged. To get baseId and tableId, consider using the search_bases and list_tables_for_base tools first.

display_records_for_table

Note: This tool is not available by default and is only enabled for clients that support interactive apps. If you are a developer who wants to use this tool, please fill out this form.

Displays an interactive widget showing record data queried from an Airtable table. Do not assume baseId and tableId. Obtain these from search_bases → list_tables_for_base. Do not attempt to pass filterByFormula. Look carefully at the filters parameter.
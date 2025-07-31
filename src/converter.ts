// Add these types at the top of the file
type ControlTypeMapping = {
    [key: string]: string;
};

// Добавляем новые типы
type PrimitiveType = 'string' | 'number' | 'boolean' | 'int' | 'float' | 'bool' | 'any';
type ComplexType = 'array' | 'object' | 'mapping';
type ControlType = PrimitiveType | ComplexType;

const TYPE_MAPPING: ControlTypeMapping = {
    'string': 'string',
    'number': 'int',
    'boolean': 'bool',
    'array': 'dyn_',
    'object': 'mapping'
};

class TypeInfo {
    type: string;
    isArray: boolean = false;
    isPrimitive: boolean = false;
    isObject: boolean = false;
    itemType?: TypeInfo;

    constructor(type: string) {
        this.type = type;
    }
}

class JsonToControl {
    private tabSize: number;
    private typeCheck: boolean;
    private nullValueDataType: string;
    private nullSafety: boolean;
    private includeCopyWithMethod: boolean = false;
    private mergeArrayApproach: boolean = true;
    private useNum: boolean = false;

    constructor(tabSize: number = 4, typeCheck: boolean = false, nullValueDataType: string = "string", nullSafety: boolean = true) {
        this.tabSize = tabSize;
        this.typeCheck = typeCheck;
        this.nullValueDataType = nullValueDataType;
        this.nullSafety = nullSafety;
    }

    setIncludeCopyWitMethod(value: boolean): void {
        this.includeCopyWithMethod = value;
    }

    setMergeArrayApproach(value: boolean): void {
        this.mergeArrayApproach = value;
    }

    setUseNum(value: boolean): void {
        this.useNum = value;
    }

    private getControlType(value: any): TypeInfo {
        const typeInfo = new TypeInfo('');

        if (value === null || value === undefined) {
            typeInfo.type = 'string'; // or 'any' if supported
            return typeInfo;
        }

        const type = typeof value;
        
        switch (type) {
            case 'string':
                typeInfo.type = 'string';
                typeInfo.isPrimitive = true;
                break;
            case 'number':
                typeInfo.type = Number.isInteger(value) ? 'int' : 'float';
                typeInfo.isPrimitive = true;
                break;
            case 'boolean':
                typeInfo.type = 'bool';
                typeInfo.isPrimitive = true;
                break;
            case 'object':
                if (Array.isArray(value)) {
                    typeInfo.isArray = true;
                    if (value.length > 0) {
                        const itemType = this.getControlType(value[0]);
                        typeInfo.itemType = itemType;
                        typeInfo.type = itemType.isPrimitive ? 
                            `dyn_${itemType.type}` : 
                            `vector<${this.toPascalCase(itemType.type)}>`;
                    } else {
                        typeInfo.type = 'dyn_any';
                    }
                } else {
                    typeInfo.type = 'mapping';
                    typeInfo.isObject = true;
                }
                break;
            default:
                typeInfo.type = 'string';
        }

        return typeInfo;
    }

    private toPascalCase(str: string): string {
        return str
            .split(/[^a-zA-Z0-9]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }

    private toSnakeCase(str: string): string {
        return str
            .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    private generateStructDoc(className: string, description: string = ''): string[] {
        return [
            '/**',
            ` * @brief ${description || className} structure`,
            ' * @details Auto-generated from JSON',
            ' * @version 0.1',
            ' * @date ' + new Date().toISOString().split('T')[0],
            ' */'
        ];
    }

    // private generateFieldDoc(fieldName: string, type: string, description: string = ''): string[] {
    //     return [
    //         '\t/**',
    //         `\t * @brief ${description || fieldName}`,
    //         `\t * @type {${type}}`,
    //         '\t */'
    //     ];
    // }


    // private generateFieldDoc(fieldName: string, type: string, description: string = ''): string[] {
    //     return [
    //         '// ' + description 
    //     ];
    // }

    private generateFromMappingMethod(className: string, fields: {name: string, type: TypeInfo}[]): string[] {
        const lines: string[] = [];
        const varName = className[0].toLowerCase() + className.slice(1);
        
        lines.push(`public ${className} ${this.toPascalCase(className)}MapToObject(mapping data = makeMapping())`);
        lines.push('{');
        lines.push(`\t${className} ${varName} = new ${className}();`);
        
        fields.forEach(field => {
            const fieldName = this.toSnakeCase(field.name);
            const fieldAccess = `${varName}.${fieldName}`;
            const dataAccess = `data["${fieldName}"]`;
            
            // lines.push(`\t// Processing ${fieldName}`);
            
            if (field.type.isArray) {
                lines.push(`\tif (mappingHasKey(data, "${fieldName}")) {`);
                lines.push(...this.generateArrayAssignment(fieldAccess, field.type, dataAccess).map(l => `\t${l}`));
                lines.push('\t} else {');
                lines.push(...this.generateArrayInitialization(fieldAccess, field.type).map(l => `\t${l}`));
                lines.push('\t}');
            } else if (field.type.isObject) {
                lines.push(`\tif (mappingHasKey(data, "${fieldName}")) {`);
                lines.push(`\t\t${fieldAccess} = ${this.toPascalCase(field.type.type)}MapToObject(${dataAccess});`);
                lines.push('\t} else {');
                lines.push(`\t\t${fieldAccess} = new ${this.toPascalCase(field.type.type)}();`);
                lines.push('\t}');
            } else {
                lines.push(`\t${fieldAccess} = mappingHasKey(data, "${fieldName}") ? ${dataAccess} : ${this.getDefaultValue(field.type)};`);
            }
        });
        
        lines.push(`\treturn ${varName};`);
        lines.push('}');
        
        return lines;
    }

    private generateToMappingMethod(className: string, fields: {name: string, type: TypeInfo}[]): string[] {
        const lines: string[] = [];
        const varName = className[0].toLowerCase() + className.slice(1);
        
        lines.push(`public mapping ${this.toPascalCase(className)}ToMapping(${className} ${varName})`);
        lines.push('{');
        lines.push('\tmapping data;');
        
        fields.forEach(field => {
            const fieldName = this.toSnakeCase(field.name);
            const fieldAccess = `${varName}.${fieldName}`;
            
            if (field.type.isArray && field.type.itemType && !field.type.itemType.isPrimitive) {
                lines.push(`\tif (${fieldAccess}.count() > 0) {`);
                lines.push(`\t\tdyn_mapping ${fieldName}Data;`);
                lines.push(`\t\tfor (int i = 0; i < ${fieldAccess}.count(); i++)`);
                lines.push(`\t\t\tdynAppendConst(${fieldName}Data, ${this.toPascalCase(field.type.itemType.type)}ToMapping(${fieldAccess}.at(i)));`);
                lines.push(`\t\tdata["${fieldName}"] = ${fieldName}Data;`);
                lines.push('\t}');
            } else if (field.type.isObject) {
                lines.push(`\tdata["${fieldName}"] = ${this.toPascalCase(field.type.type)}ToMapping(${fieldAccess});`);
            } else {
                lines.push(`\tdata["${fieldName}"] = ${fieldAccess};`);
            }
        });
        
        lines.push('\treturn data;');
        lines.push('}');
        
        return lines;
    }

    private getDefaultValue(typeInfo: TypeInfo): string {
        switch (typeInfo.type) {
            case 'int':
                return '0';
            case 'float':
                return '0.0';
            case 'bool':
                return 'false';
            case 'string':
                return '""';
            case 'mapping':
                return 'makeMapping()';
            default:
                if (typeInfo.type.startsWith('dyn_')) {
                    return `makeDyn${typeInfo.type.substring(4)}()`;
                } else if (typeInfo.type.startsWith('vector<')) {
                    return `makeVector<${typeInfo.type.substring(7, typeInfo.type.length - 1)}>()`;
                }
                return `new ${typeInfo.type}()`;
        }
    }



    // Add these helper methods to the JsonToControl class

private processNestedObjects(json: any, className: string): string[] {
    const result: string[] = [];
    const processedTypes = new Set<string>();

    const processObject = (obj: any, parentName: string): void => {
        for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                const nestedClassName = this.toPascalCase(key);
                if (!processedTypes.has(nestedClassName)) {
                    processedTypes.add(nestedClassName);
                    const nestedResult = this.parse(nestedClassName, value);
                    result.unshift(...nestedResult.split('\n'));
                }
            } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                const nestedClassName = this.toPascalCase(key);
                if (!processedTypes.has(nestedClassName)) {
                    processedTypes.add(nestedClassName);
                    const nestedResult = this.parse(nestedClassName, value[0]);
                    result.unshift(...nestedResult.split('\n'));
                }
            }
        }
    };

    processObject(json, className);
    return result;
}

private generateArrayInitialization(fieldName: string, typeInfo: TypeInfo): string[] {
    const lines: string[] = [];
    
    if (typeInfo.itemType) {
        if (typeInfo.itemType.isPrimitive) {
            lines.push(`${fieldName} = makeDyn${this.toPascalCase(typeInfo.itemType.type)}();`);
        } else {
            const itemType = this.toPascalCase(typeInfo.itemType.type);
            lines.push(`${fieldName} = makeVector<${itemType}>();`);
        }
    } else {
        lines.push(`${fieldName} = makeDynAny();`);
    }
    
    return lines;
}

private generateArrayAssignment(fieldName: string, typeInfo: TypeInfo, valueAccess: string): string[] {
    const lines: string[] = [];
    
    if (typeInfo.itemType) {
        if (typeInfo.itemType.isPrimitive) {
            lines.push(`${fieldName} = ${valueAccess};`);
        } else {
            const itemType = this.toPascalCase(typeInfo.itemType.type);
            lines.push(`if (dynlen(${valueAccess}) > 0) {`);
            lines.push(`\tfor (int i = 1; i <= dynlen(${valueAccess}); i++) {`);
            lines.push(`\t\t${fieldName}.append(${itemType}MapToObject(${valueAccess}[i]));`);
            lines.push('\t}');
            lines.push('}');
        }
    } else {
        lines.push(`${fieldName} = ${valueAccess};`);
    }
    
    return lines;
}

    public parse(className: string, json: any): string {
    if (!json || typeof json !== 'object') {
        throw new Error('Input must be a JSON object');
    }

    const structName = this.toPascalCase(className);
    const fields: {name: string, type: TypeInfo}[] = [];
    let result: string[] = [];

    // Process nested objects first
    const nestedObjects = this.processNestedObjects(json, structName);
    result.push(...nestedObjects);

    // Generate struct definition
    result.push(...this.generateStructDoc(structName));
    result.push(`struct ${structName}`);
    result.push('{');

    // Process fields
    for (const [key, value] of Object.entries(json)) {
        const fieldName = this.toSnakeCase(key);
        const typeInfo = this.getControlType(value);
        fields.push({ name: fieldName, type: typeInfo });
        
        // Add field documentation
        // result.push(...this.generateFieldDoc(fieldName, typeInfo.type));
        
        // Add field definition
        result.push(`\t${typeInfo.type}\t${fieldName};`);
        // result.push(''); // Empty line between fields
    }

    result.push('};');
    result.push(''); // Empty line after struct

    // Generate conversion methods
    result.push(...this.generateFromMappingMethod(structName, fields));
    result.push(''); // Empty line between methods
    result.push(...this.generateToMappingMethod(structName, fields));

    return result.join('\n');
}
}

export { JsonToControl };
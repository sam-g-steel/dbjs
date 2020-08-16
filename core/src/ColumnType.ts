export interface ImageType {
    channels: "grey" | "gray" | "rgb" | "rgba";
    height: number;
    width: number;
}

export type ColumnType =
    // Native Types
    | "boolean"
    | "number"
    | "object"
    | "string"
    | "url"
    //
    | ImageType;

export function getColumnType(value: any): ColumnType {
    return typeof value as ColumnType;
}

import { SuperArray } from "./SuperArray";

test("Create empty SuperArray", () => {
    const sArray = new SuperArray([]);
    expect(sArray.length).toBe(0);
});

test("Create a SuperArray with 3 elements", () => {
    const sArray = new SuperArray([1, 2, 3]);
    expect(sArray.length).toBe(3);
});

test("Test abs", () => {
    const sArray = new SuperArray<number>([-2, 3]);
    const result = sArray.abs();
    expect(result[0]).toBe(2);
    expect(result[1]).toBe(3);
});

test("Test avg", () => {
    const sArray = new SuperArray<number>([1, 2, 3]);

    expect(sArray.avg()).toBe(2);
});

test("Test map", () => {
    const sArray = new SuperArray<number>([1, 2, 3]);
    const result = sArray.map(a => a + 1);
    expect(result[0]).toBe(2);
    expect(result[1]).toBe(3);
    expect(result[2]).toBe(4);
});

test("Test min & max", () => {
    const sArray = new SuperArray([1, 2, 3]);
    expect(sArray.min()).toBe(1);
    expect(sArray.max()).toBe(3);
});

test("Test normalize", () => {
    const sArray = new SuperArray<number>([1, 2, 3]);
    const result = sArray.normalize();
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(0.5);
    expect(result[2]).toBe(1);
});

test("Test sum", () => {
    const sArray = new SuperArray<number>([1, 2, 3]);

    expect(sArray.sum()).toBe(6);
});

test("Test unique", () => {
    let sArray = new SuperArray([1, 2, 3]);
    expect(sArray.unique().length).toBe(3);

    sArray = new SuperArray([1, 1, 3]);
    expect(sArray.unique().length).toBe(2);

    sArray = new SuperArray([1, 3, 3]);
    expect(sArray.unique().length).toBe(2);
});

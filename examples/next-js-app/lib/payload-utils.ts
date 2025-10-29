import { beginCell, Cell } from "@ton/core";

/**
 * Modifies the QueryID in a TON transaction payload
 * Based on the reference implementation from v2.1
 *
 * @param payload - Base64 encoded payload string
 * @param newQueryId - New QueryID to set (64-bit unsigned integer)
 * @returns Modified payload as Base64 string, or original payload if modification fails
 */
export function modifyQueryId(payload: string, newQueryId: bigint): string {
  try {
    const decodedBuffer = Buffer.from(payload, "base64");
    const cells = Cell.fromBoc(decodedBuffer);
    const cell = cells[0];

    if (!cell) {
      throw new Error("Failed to parse BOC");
    }

    const slice = cell.beginParse();

    // Read the OpCode (32 bits)
    const opCode = slice.loadUint(32);

    // Create new cell with OpCode and new QueryID
    const newCell = beginCell().storeUint(opCode, 32).storeUint(newQueryId, 64);

    // Skip the original OpCode and QueryID
    const originalSlice = cell.beginParse();
    originalSlice.skip(32 + 64);

    // Copy remaining bits
    const remainingBits = originalSlice.remainingBits;
    if (remainingBits > 0) {
      const remainingData = originalSlice.loadBits(remainingBits);
      newCell.storeBits(remainingData);
    }

    // Copy remaining reference cells
    const refCount = originalSlice.remainingRefs;
    if (refCount > 0) {
      for (let i = 0; i < refCount; i++) {
        newCell.storeRef(originalSlice.loadRef());
      }
    }

    return Buffer.from(newCell.endCell().toBoc()).toString("base64");
  } catch (error) {
    console.error("Error modifying query ID:", error);
    return payload; // Return original payload on error
  }
}

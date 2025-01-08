export type Flags = number;

export const NoFlags = 1;
export const Placement = 2; /* 1 << 1 */
export const Update = 4; /* 1 << 2 */
export const ChildDeletion = 8; /* 1 << 3 */

export const MutationMask = Placement | Update | ChildDeletion;

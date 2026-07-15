export interface SettlementListItem {
  id: string;
  groupId: string;
  groupName: string;
  groupIcon: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  amountLabel: string;
  notes?: string;
  createdAt: string;
}

export interface OutstandingDebt {
  id: string;
  groupId: string;
  groupName: string;
  groupIcon: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  amountLabel: string;
  /** Positive = someone owes you, negative = you owe */
  direction: "you_owe" | "owed_to_you";
}

export interface CreateSettlementInput {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  notes?: string;
}

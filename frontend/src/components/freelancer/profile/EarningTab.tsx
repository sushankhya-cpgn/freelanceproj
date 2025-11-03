import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock } from "lucide-react";
import { type Transaction } from "@/type/job/profiledata";


interface EarningsTabProps {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingEarnings: number;
  transactions: Transaction[];
}

export const EarningsTab: React.FC<EarningsTabProps> = ({
  totalEarnings,
  monthlyEarnings,
  pendingEarnings,
  transactions,
}) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">${totalEarnings.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">${monthlyEarnings.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">${pendingEarnings.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 && (
              <p className="text-muted-foreground text-center">No transactions yet.</p>
            )}
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between pb-4 border-b last:border-0"
              >
                <div>
                  <p className="font-semibold">{tx.title}</p>
                  <p className="text-sm text-muted-foreground">{tx.date}</p>
                </div>
                <span
                  className={`font-bold ${
                    tx.amount >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : "-"}${Math.abs(tx.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

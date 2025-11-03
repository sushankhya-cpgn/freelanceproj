import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryCardProps {
    name: string;
    color: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ name, color }) => {
    return (
        <Card className="group cursor-pointer hover:shadow-md transition">
            <CardContent className="flex flex-col items-center justify-center py-6">
                <div className={`w-10 h-10 rounded-full ${color} mb-3`} />
                <p className="text-sm font-medium group-hover:text-primary text-center">{name}</p>
            </CardContent>
        </Card>
    );
};

export default CategoryCard;

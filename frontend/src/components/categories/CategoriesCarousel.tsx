import React from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import CategoryCard from "./CategoryCard";

const CategoriesSection: React.FC = () => {
    const categories = [
        { name: "Design & Creative", color: "bg-pink-500" },
        { name: "Web Development", color: "bg-indigo-500" },
        { name: "Writing & Translation", color: "bg-emerald-500" },
        { name: "Data & Analytics", color: "bg-yellow-500" },
        { name: "Marketing", color: "bg-blue-500" },
        { name: "Video & Animation", color: "bg-purple-500" },
        { name: "AI & Data Science", color: "bg-yellow-500" },
        { name: "Business", color: "bg-red-500" },
    ];

    return (
        <section id="categories" className="max-w-6xl mx-auto py-16 px-6">
            <h3 className="text-2xl font-semibold text-center mb-10">Browse by Categories</h3>
            <div className="flex justify-center items-center">
                <Carousel opts={{ align: "start" }} className="w-full max-w-4xl">
                    <CarouselContent>
                        {categories.map((cat, index) => (
                            <CarouselItem key={index} className="basis-1/3 sm:basis-1/4 md:basis-1/6 flex justify-center">
                                <CategoryCard name={cat.name} color={cat.color} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
        </section>
    );
};

export default CategoriesSection;

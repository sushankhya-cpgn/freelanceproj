import React from "react";

const Footer: React.FC = () => {
    return (
        <footer className="border-t py-8 mt-10 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} FreelancePro. Built for professionals.
        </footer>
    );
};

export default Footer;

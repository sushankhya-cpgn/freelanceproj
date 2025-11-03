import Header from "@/components/layout/Header";
import { MessagingInterface } from "@/components/messaging/MessagingInterface";
import { CLIENT_NAV_ITEMS } from "@/constants/navigation";


function ClientMessagePage() {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Header navItems={CLIENT_NAV_ITEMS} showLogout />
            <div className="flex-1 overflow-hidden">
                <MessagingInterface />
            </div>
        </div>
    );
}

export default ClientMessagePage;
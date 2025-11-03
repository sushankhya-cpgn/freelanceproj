import Header from "@/components/layout/Header";
import { MessagingInterface } from "@/components/messaging/MessagingInterface";
import { FREELANCER_NAV_ITEMS } from "@/constants/navigation";


function MessagePage() {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Header navItems={FREELANCER_NAV_ITEMS} showLogout />
            <div className="flex-1 overflow-hidden">
                <MessagingInterface />
            </div>
        </div>
    );
}

export default MessagePage;
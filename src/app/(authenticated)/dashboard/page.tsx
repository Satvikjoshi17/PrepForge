
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import Recommendations from '@/components/dashboard/Recommendations';
import StrengthsWeaknesses from '@/components/dashboard/StrengthsWeaknesses';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <WelcomeBanner />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <div className="lg:col-span-1 row-start-2 lg:row-start-1">
          <Recommendations />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div className="lg:col-span-1">
          <StrengthsWeaknesses />
        </div>
      </div>
    </div>
  );
}

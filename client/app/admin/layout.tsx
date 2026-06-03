import Sidebar from '@/components/staff/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 外框：占满全屏，横向排列 (flex)
    <div className="flex h-screen bg-white">
      
      {/* 1. 把你刚才做好的暗蓝色侧边栏放这里！ */}
      <Sidebar />

      {/* 2. 右侧剩余的全部空间留给主舞台 (children 代表里面具体的页面内容) */}
      <div className="flex-1 flex overflow-hidden bg-slate-50">
        {children}
      </div>

    </div>
  );
}
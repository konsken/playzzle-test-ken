// src/components/icons/logo.tsx
export const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        {/* Yellow Piece */}
        <path 
            d="M50,10A15,15,0,0,0,35,25C35,25,35,35,25,35A15,15,0,0,0,10,50H50V10Z"
            fill="#facc15"
        />
        {/* Red Piece */}
        <path
            d="M90,50A15,15,0,0,0,75,35C75,35,65,35,65,25A15,15,0,0,0,50,10V50H90Z"
            fill="#ef4444"
        />
        {/* Blue Piece */}
        <path
            d="M50,90A15,15,0,0,0,65,75C65,75,65,65,75,65A15,15,0,0,0,90,50H50V90Z"
            fill="#3b82f6"
        />
        {/* Green Piece */}
        <path
            d="M10,50A15,15,0,0,0,25,65C25,65,35,65,35,75A15,15,0,0,0,50,90V50H10Z"
            fill="#22c55e"
        />
    </svg>
);
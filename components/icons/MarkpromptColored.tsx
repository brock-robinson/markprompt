import { FC } from 'react';

type MarkpromptColoredIconProps = {
  className?: string;
};

export const MarkpromptColoredIcon: FC<MarkpromptColoredIconProps> = ({
  className,
}) => {
  return (
    <svg
      viewBox="0 0 240 169"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x={3.382}
        y={3}
        width={233.236}
        height={163}
        rx={39.756}
        stroke="url(#prefix__paint0_linear_7139_206973)"
        strokeWidth={6}
      />
      <rect
        x={3.382}
        y={3}
        width={233.236}
        height={163}
        rx={39.756}
        fill="url(#prefix__paint1_linear_7139_206973)"
      />
      <path
        d="M175.659 46.732a6.626 6.626 0 016.626-6.626h13.252a6.626 6.626 0 016.626 6.626v33.13a6.626 6.626 0 01-6.626 6.626h-13.252a6.626 6.626 0 01-6.626-6.626v-33.13zM204.813 114.317c0 8.783-7.12 15.903-15.902 15.903-8.783 0-15.903-7.12-15.903-15.903 0-8.783 7.12-15.902 15.903-15.902 8.782 0 15.902 7.119 15.902 15.902zM44.463 130.22a6.626 6.626 0 01-6.626-6.626V46.732a6.626 6.626 0 016.626-6.626h16.694c2.013 0 3.916.915 5.174 2.486l19.34 24.176c2.653 3.316 7.696 3.316 10.349 0l19.34-24.175a6.627 6.627 0 015.174-2.487h16.694a6.626 6.626 0 016.626 6.626v76.862a6.627 6.627 0 01-6.626 6.626h-13.252a6.626 6.626 0 01-6.626-6.626V97.426c0-6.264-7.888-9.03-11.8-4.14L96.02 105.2c-2.653 3.316-7.696 3.316-10.349 0l-9.53-11.912c-3.912-4.891-11.8-2.125-11.8 4.139v26.168a6.626 6.626 0 01-6.625 6.626H44.462z"
        fill="#fff"
      />
      <defs>
        <linearGradient
          id="prefix__paint0_linear_7139_206973"
          x1={7.358}
          y1={3}
          x2={215.415}
          y2={166}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="color(display-p3 .7294 .902 .9922)" />
          <stop offset={1} stopColor="color(display-p3 .851 .9765 .6157)" />
        </linearGradient>
        <linearGradient
          id="prefix__paint1_linear_7139_206973"
          x1={3}
          y1={3}
          x2={237}
          y2={166}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" stopOpacity={0.2} />
          <stop offset={1} stopColor="#fff" stopOpacity={0.05} />
        </linearGradient>
      </defs>
    </svg>
  );
};

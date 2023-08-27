import React, { DetailedHTMLProps, AnchorHTMLAttributes } from "react";

const Logo: React.FC<DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>> = (props) => {
  return (
    <a className="logo" {...props}>
      <svg
        version="1.1"
        id="svg5"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="0 0 1668.56 1221.19"
      >
        <g id="layer1" transform="translate(52.390088,-25.058597)">
          <path
            id="path1009"
            d="M283.94,167.31l386.39,516.64L281.5,1104h87.51l340.42-367.76L984.48,1104h297.8L874.15,558.3l361.92-390.99
    h-87.51l-313.51,338.7l-253.31-338.7H283.94z M412.63,231.77h136.81l604.13,807.76h-136.81L412.63,231.77z"
            style={{ fill: "var(--primary-color)" }}
          />
        </g>
      </svg>
    </a>
  );
};

export default Logo;
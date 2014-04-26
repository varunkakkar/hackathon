<?php

class Vote extends BaseModel
{
	/**
     * White list of attributes that can be mass assigned
     *
     * @var array
     */
    public static $accessible = array('like', 'email');


    /**
     * Rules for model validation.
     *
     * @var array
     */
    public static $rules = array(
		'like' => 'required|integer',
        'ip' => 'required',
        'email' => 'required|email',
    );
}

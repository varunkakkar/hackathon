<?php

class BaseModel extends Eloquent
{
    /**
     * Enable timestamps
     *
     * @var boolean
     */
    public static $timestamps = TRUE;


    /**
     * Explicitly whitelist attributes that can be mass assigned
     *
     * @var array
     */
    public static $accessible = array();


    /**
     * Rules for model validation
     *
     * @var array
     */
    public static $rules = array();


    /**
     * If validation fails, errors are stored here.
     *
     * @var Messages
     */
    public $errors;


    /**
     * Do before validation
     */
    protected function before_validate() {}


    /**
     * Do after validation
     */
    protected function after_validate() {}


    /**
     * Do before save
     */
    protected function before_save() {}


    /**
     * Do after save
     */
    protected function after_save() {}


    /**
     * Validate the model attributes.
     *
     * @return bool
     */
    public function validate()
    {
        $this->before_validate();

        $v = Validator::make($this->to_array(), static::$rules);

        if (! $v->passes()) {
            $this->errors = $v->errors;
            return FALSE;
        }

        $this->after_validate();
        return TRUE;
    }


    /**
     * Return errors due to last validation.
     *
     * @return Messages
     */
    public function errors()
    {
        return $this->errors;
    }


    /**
     * Save model to DB.
     *
     * @param  boolean
     * @return bool
     */
    public function save($skip_validation = FALSE)
    {
        if (! $skip_validation && ! $this->validate())
        {
            return FALSE;
        }

        $this->before_save();

        $result = parent::save();

        $result and $this->after_save();

        return $result;
    }
}
